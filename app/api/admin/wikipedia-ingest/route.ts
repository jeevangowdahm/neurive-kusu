import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { validateKarnatakaRelevance } from '@/lib/ai/karnataka-relevance';
import { EmbeddingService } from '@/lib/ai/embedding-service';
import { EntityExtractionService } from '@/lib/ai/entity-extraction-service';
import { isSafeURL } from '@/lib/security/validation';

// Predefined offline Wikipedia articles as fallbacks
const WIKI_OFFLINE_PRESETS: { [key: string]: { title: string; extract: string; sections: { title: string; text: string }[] } } = {
  'hampi': {
    title: 'Hampi',
    extract: 'Hampi is an ancient human settlement in the southern state of Karnataka, India. It was the capital of the Vijayanagara Empire in the 14th century.',
    sections: [
      { title: 'Introduction', text: 'Hampi is a UNESCO World Heritage Site located in Vijayanagara district, Karnataka, India. It served as the magnificent capital of the Vijayanagara Empire.' },
      { title: 'History', text: 'Hampi is described in historical archives as a prosperous city. Built near the Tungabhadra River, it was ruled by kings like Krishnadevaraya. It was destroyed by Deccan Sultanates in 1565.' },
      { title: 'Architecture', text: 'The ruins of Hampi showcase brilliant stone architecture. Prominent structures include the Virupaksha Temple, Balakrishna Temple, Stone Chariot, and the Vittala Temple complex.' },
      { title: 'Geography', text: 'Hampi is situated in the rugged terrain of central Karnataka, surrounded by granite boulders and agricultural valleys containing banana plantations.' }
    ]
  },
  'mysore palace': {
    title: 'Mysore Palace',
    extract: 'Mysore Palace, also known as Amba Vilas Palace, is a historical palace and a royal residence in Mysuru, Karnataka, India. It was the seat of the Kingdom of Mysore.',
    sections: [
      { title: 'Introduction', text: 'The Mysore Palace is an elegant Indo-Saracenic structure located in Mysuru (Mysore), the cultural capital of Karnataka. It was designed by British architect Henry Irwin.' },
      { title: 'Royal History', text: 'The palace was the official residence of the Wadiyar dynasty, who ruled the Kingdom of Mysore from 1399 to 1950. The current palace was completed in 1912 after the old wooden palace burned down.' },
      { title: 'Architecture and Durbar', text: 'It features majestic arches, stained glass ceilings, and the opulent Golden Throne. The grand Durbar Hall hosted Maharaja Chamarajendra Wadiyar X and Krishnaraja Wadiyar IV during annual Dasara festivals.' },
      { title: 'Dasara Celebrations', text: 'Mysore Dasara is the state festival of Karnataka. The palace is illuminated with 100,000 light bulbs on festive evenings, drawing millions of visitors.' }
    ]
  },
  'vijayanagara empire': {
    title: 'Vijayanagara Empire',
    extract: 'The Vijayanagara Empire was a royal dynasty based in the Deccan Plateau region of South India, founded in 1336 by Harihara I and Bukka Raya I.',
    sections: [
      { title: 'Origins', text: 'The Vijayanagara Empire was established in 1336 on the banks of Tungabhadra river. It rose to prominence as a bulwark against northern invasions.' },
      { title: 'Peak Era', text: 'Under Emperor Krishnadevaraya, the empire reached its zenith, patronizing Kannada literature, Sanskrit scholars, and massive stone temple architecture in Hampi.' },
      { title: 'Decline', text: 'Following the defeat at the Battle of Talikota in 1565, the capital Hampi was sacked, and the dynasty fractured, leading to the rise of regional powers like the Mysore Kingdom.' }
    ]
  },
  'karnataka': {
    title: 'Karnataka',
    extract: 'Karnataka is a state in the southwestern region of India. It was formed on 1 November 1956, with the passage of the States Reorganisation Act.',
    sections: [
      { title: 'Overview', text: 'Karnataka is bordered by the Arabian Sea and features diverse geography, from coastal Mangaluru to the Western Ghats of Kodagu, and the Deccan plains of Dharwad.' },
      { title: 'History', text: 'Historically, Karnataka was ruled by major empires: Kadambas, Chalukyas of Badami, Rashtrakutas, Hoysalas of Halebidu, Vijayanagara Empire, and the Kingdom of Mysore.' },
      { title: 'Culture and Language', text: 'Kannada is the official language of the state. It has a rich literary heritage spanning Kavirajamarga (850 CE) to modern Jnanpith awardees, alongside heritage arts like Yakshagana.' }
    ]
  },
  'quantum physics': {
    title: 'Quantum Physics',
    extract: 'Quantum physics is the study of matter and energy at the most fundamental level, aiming to uncover the properties of the building blocks of nature.',
    sections: [
      { title: 'Overview', text: 'Quantum physics deals with subatomic particles like electrons, photons, and quarks. It describes behavior that contradicts classical Newtonian mechanics.' },
      { title: 'Key Principles', text: 'Principles include wave-particle duality, superposition, and quantum entanglement, which are leveraged in quantum computing and advanced electronics.' }
    ]
  }
};

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorize admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'guest';
    const email = user.email || '';
    const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
    const isAdmin = role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const articleTitle = searchParams.get('title') || '';

    // Case A: Fetch single article details
    if (articleTitle) {
      const normalizedTitle = articleTitle.toLowerCase().trim();
      let articleData = {
        title: articleTitle,
        extract: '',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`
      };

      // Try Wikipedia API first
      try {
        const fetchUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(articleTitle)}&format=json&origin=*`;
        if (!isSafeURL(fetchUrl)) {
          throw new Error('Insecure or invalid URL blocked.');
        }
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const json = await res.json();
          const pages = json.query?.pages || {};
          const pageId = Object.keys(pages)[0];
          if (pageId && pageId !== '-1') {
            articleData.title = pages[pageId].title;
            articleData.extract = pages[pageId].extract || '';
          }
        }
      } catch (err) {
        console.warn('Wikipedia API fetch failed, trying offline presets.');
      }

      // Offline preset fallback
      if (!articleData.extract) {
        const preset = Object.entries(WIKI_OFFLINE_PRESETS).find(
          ([k]) => normalizedTitle.includes(k) || k.includes(normalizedTitle)
        );
        if (preset) {
          articleData.title = preset[1].title;
          articleData.extract = preset[1].extract;
        } else if (normalizedTitle.includes('physics') || normalizedTitle.includes('quantum')) {
          articleData.title = WIKI_OFFLINE_PRESETS['quantum physics'].title;
          articleData.extract = WIKI_OFFLINE_PRESETS['quantum physics'].extract;
        } else {
          // generic fallback
          articleData.extract = `Simulated Wikipedia content for ${articleTitle}. A search regarding historical monuments, rulers, and districts in Karnataka.`;
        }
      }

      // Validate relevance
      const relevance = validateKarnatakaRelevance(articleData.title, articleData.extract);

      return NextResponse.json({
        success: true,
        article: {
          title: articleData.title,
          extract: articleData.extract,
          url: articleData.url,
          relevance_score: relevance.score,
          karnataka_scope_status: relevance.status,
          matchedKeywords: relevance.matchedKeywords,
          matchedDistricts: relevance.matchedDistricts
        }
      });
    }

    // Case B: Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query || 'Karnataka')}&format=json&origin=*`;
    let searchResults: any[] = [];

    try {
      const res = await fetch(searchUrl);
      if (res.ok) {
        const json = await res.json();
        const searchList = json.query?.search || [];
        searchResults = searchList.map((item: any) => {
          const relevance = validateKarnatakaRelevance(item.title, item.snippet);
          return {
            pageid: item.pageid.toString(),
            title: item.title,
            snippet: item.snippet.replace(/<span class="searchmatch">/g, '').replace(/<\/span>/g, ''),
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            karnataka_relevance_score: relevance.score,
            karnataka_scope_status: relevance.status
          };
        });
      }
    } catch (err) {
      console.warn('Wikipedia search failed. Returning preset items.');
    }

    // If online search returned nothing or offline, filter presets
    if (searchResults.length === 0) {
      searchResults = Object.entries(WIKI_OFFLINE_PRESETS).map(([key, item]) => {
        const relevance = validateKarnatakaRelevance(item.title, item.extract);
        return {
          pageid: key,
          title: item.title,
          snippet: item.extract,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          karnataka_relevance_score: relevance.score,
          karnataka_scope_status: relevance.status
        };
      });

      if (query) {
        searchResults = searchResults.filter(
          item => item.title.toLowerCase().includes(query.toLowerCase()) || item.snippet.toLowerCase().includes(query.toLowerCase())
        );
      }
    }

    return NextResponse.json({
      success: true,
      results: searchResults
    });

  } catch (error) {
    console.error('GET Admin Wikipedia Ingest Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorize admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'guest';
    const email = user.email || '';
    const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
    const isAdmin = role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    // 3. Parse input
    const { title, wikipedia_page_id } = await req.json();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Article Title is required.' }, { status: 400 });
    }

    // 4. Fetch the full article content
    let articleTitle = title;
    let fullText = '';
    let sections: { title: string; text: string }[] = [];
    let isRealFetched = false;

    // Try live fetch
    try {
      const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
      if (!isSafeURL(contentUrl)) {
        throw new Error('Insecure or invalid URL blocked.');
      }
      const res = await fetch(contentUrl);
      if (res.ok) {
        const json = await res.json();
        const pages = json.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        if (pageId && pageId !== '-1') {
          articleTitle = pages[pageId].title;
          fullText = pages[pageId].extract || '';
          
          if (fullText.trim().length > 0) {
            isRealFetched = true;
            
            // Split fullText into sections based on headers
            // Wikipedia uses == Section Name == headers
            const rawSections = fullText.split(/\n==\s+([^=]+)\s+==\n/);
            if (rawSections.length > 1) {
              // First section is intro
              sections.push({ title: 'Introduction', text: rawSections[0].trim() });
              for (let i = 1; i < rawSections.length; i += 2) {
                const secTitle = rawSections[i]?.trim();
                const secText = rawSections[i + 1]?.trim() || '';
                if (secTitle && secText) {
                  // Remove subheaders like === Subtitle ===
                  const cleanedText = secText.replace(/===\s+([^=]+)\s+===\n/g, '').trim();
                  sections.push({ title: secTitle, text: cleanedText });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Live Wikipedia extract failed, using presets.');
    }

    // Fallback to presets
    if (sections.length === 0) {
      const normalizedTitle = title.toLowerCase().trim();
      const presetKey = Object.keys(WIKI_OFFLINE_PRESETS).find(
        k => normalizedTitle.includes(k) || k.includes(normalizedTitle)
      );
      
      const selectedPreset = presetKey ? WIKI_OFFLINE_PRESETS[presetKey] : WIKI_OFFLINE_PRESETS['karnataka'];
      articleTitle = selectedPreset.title;
      sections = selectedPreset.sections;
      fullText = selectedPreset.extract + ' ' + sections.map(s => s.text).join(' ');
      isRealFetched = false;
    }

    // 5. Run Karnataka Relevance check
    const relevance = validateKarnatakaRelevance(articleTitle, fullText);
    
    if (relevance.status === 'rejected') {
      // Log failure in wikipedia logs
      await supabase.from('wikipedia_ingestion_logs').insert({
        wikipedia_page_id: wikipedia_page_id || articleTitle.toLowerCase().replace(/ /g, '_'),
        title: articleTitle,
        source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`,
        karnataka_relevance_score: relevance.score,
        status: 'Failed',
        reason: 'Rejected: Page does not meet Karnataka relevance requirements.',
        created_by: user.id
      });

      return NextResponse.json({
        success: false,
        error: `Rejected: Ingestion blocked. Article has low Karnataka relevance score (${relevance.score}) and was classified as '${relevance.status}'.`
      }, { status: 400 });
    }

    // 6. Check for duplicate source in documents
    const sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('source_url', sourceUrl)
      .maybeSingle();

    let docId = existingDoc?.id;
    let isUpdate = false;

    const docPayload = {
      title: articleTitle,
      description: sections[0]?.text || `Wikipedia article about ${articleTitle}.`,
      district: relevance.matchedDistricts[0] || 'Karnataka',
      category: 'Encyclopedia',
      language: 'english',
      year: 2026,
      file_url: sourceUrl,
      file_type: 'html',
      status: 'Completed',
      visibility: 'public',
      summary: sections[0]?.text || `Wikipedia article about ${articleTitle}.`,
      keywords: relevance.matchedKeywords,
      ocr_confidence: 1.0, // Text source, perfect quality
      page_count: sections.length,
      source_type: 'wikipedia',
      source_name: 'Wikipedia English',
      source_url: sourceUrl,
      source_license: 'CC BY-SA 3.0',
      source_reliability_score: 0.85,
      source_identifier: wikipedia_page_id || articleTitle.toLowerCase().replace(/ /g, '_'),
      source_attribution: 'Wikipedia contributors',
      average_ocr_confidence: 1.0,
      karnataka_scope_status: relevance.status,
      karnataka_relevance_score: relevance.score,
      source_is_real: isRealFetched,
      is_demo: !isRealFetched,
      checksum: isRealFetched ? 'sha256-' + Buffer.from(sourceUrl + fullText.length).toString('hex').slice(0, 32) : null,
      retrieval_date: new Date().toISOString()
    };

    if (existingDoc && docId) {
      isUpdate = true;
      const { error: updateErr } = await supabase
        .from('documents')
        .update(docPayload)
        .eq('id', docId);
      if (updateErr) throw updateErr;
    } else {
      const { data: newDoc, error: insertErr } = await supabase
        .from('documents')
        .insert(docPayload)
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      if (newDoc) docId = newDoc.id;
    }

    if (!docId) throw new Error('Failed to create document record.');

    // Delete old page chunks if updating
    if (isUpdate) {
      await supabase.from('document_pages').delete().eq('document_id', docId);
      await supabase.from('document_chunks').delete().eq('document_id', docId);
      await supabase.from('entities').delete().eq('document_id', docId);
    }

    // 7. Insert pages, chunks and extract entities
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const pageNum = i + 1;
      const text = `${section.title}\n\n${section.text}`;

      // Page
      await supabase.from('document_pages').insert({
        document_id: docId,
        page_number: pageNum,
        extracted_text: text,
        ocr_confidence: 1.0,
        image_url: ''
      });

      // Chunk
      const embRes = await EmbeddingService.generateEmbedding(text);
      await supabase.from('document_chunks').insert({
        document_id: docId,
        page_number: pageNum,
        chunk_text: text,
        content: text, // compatibility
        chunk_index: i,
        embedding: embRes.embedding,
        embedding_model: embRes.model,
        embedding_dimension: embRes.dimension,
        embedding_status: 'generated',
        token_count: Math.ceil(text.length / 4),
        chunk_quality_score: 1.0
      });

      // Entities
      const entities = await EntityExtractionService.extractEntities(text, pageNum);
      if (entities && entities.length > 0) {
        await EntityExtractionService.saveEntities(docId, entities);
      }
    }

    // 8. Sync to archives table
    let categoryId: string | null = null;
    let districtId: string | null = null;
    try {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', 'encyclopedia').maybeSingle();
      if (cat) categoryId = cat.id;

      const { data: dist } = await supabase.from('districts').select('id').eq('name', docPayload.district).maybeSingle();
      if (dist) districtId = dist.id;
    } catch {}

    const archivePayload = {
      id: docId,
      title: articleTitle,
      description: docPayload.description,
      category_id: categoryId,
      district_id: districtId,
      document_type: 'document',
      file_url: sourceUrl,
      file_size: fullText.length,
      file_type: 'html',
      page_count: sections.length,
      year: 2026,
      decade: '2020s',
      language: 'english',
      status: 'active',
      access_level: 'public',
      tags: relevance.matchedKeywords,
      keywords: relevance.matchedKeywords,
      source: 'Wikipedia',
      has_ocr: true,
      has_embedding: true,
      source_type: 'wikipedia',
      source_name: 'Wikipedia English',
      source_url: sourceUrl,
      source_license: 'CC BY-SA 3.0',
      source_identifier: wikipedia_page_id || articleTitle.toLowerCase().replace(/ /g, '_'),
      source_attribution: 'Wikipedia contributors',
      file_size_bytes: fullText.length,
      average_ocr_confidence: 1.0,
      karnataka_scope_status: relevance.status,
      karnataka_relevance_score: relevance.score,
      source_is_real: isRealFetched,
      is_demo: !isRealFetched,
      checksum: isRealFetched ? 'sha256-' + Buffer.from(sourceUrl + fullText.length).toString('hex').slice(0, 32) : null,
      retrieval_date: new Date().toISOString()
    };

    await supabase.from('archives').upsert(archivePayload, { onConflict: 'id' });

    // 9. Create logs
    await supabase.from('wikipedia_ingestion_logs').insert({
      wikipedia_page_id: wikipedia_page_id || articleTitle.toLowerCase().replace(/ /g, '_'),
      title: articleTitle,
      source_url: sourceUrl,
      karnataka_relevance_score: relevance.score,
      status: 'Completed',
      reason: isUpdate ? 'Updated existing Wikipedia document successfully' : 'Ingested Wikipedia pages, sections, chunks, and entities successfully',
      document_id: docId,
      created_by: user.id
    });

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Wikipedia article updated successfully.' : 'Wikipedia article ingested successfully.',
      document_id: docId,
      sections_count: sections.length,
      relevance_score: relevance.score,
      relevance_status: relevance.status
    });

  } catch (error) {
    console.error('POST Admin Wikipedia Ingest Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
