import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/security/rate-limit';

// Karnataka districts
const DISTRICTS = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Belagavi', 'Dakshina Kannada',
  'Ballari', 'Kalaburagi', 'Tumakuru', 'Shivamogga', 'Vijayapura',
  'Hassan', 'Dharwad', 'Raichur', 'Chitradurga', 'Kodagu',
  'Mandya', 'Udupi', 'Uttara Kannada', 'Kolar', 'Chikkaballapur',
  'Gadag', 'Haveri', 'Koppal', 'Yadgir', 'Bidar',
  'Bagalkot', 'Bijapur', 'Ramanagara', 'Chikkamagaluru', 'Davanagere'
];

// Categories
const CATEGORIES = [
  'Land Records', 'Court Records', 'Temple Records', 'Gazette Notifications',
  'Manuscripts', 'Census Records', 'Maps & Surveys', 'Kannada Literature',
  'Revenue Records', 'Archaeological Records', 'Freedom Movement',
  'Administrative Records', 'Palace Records', 'Military Records',
  'Inscriptions', 'Government Orders'
];

// Languages
const LANGUAGES = ['kannada', 'english', 'hindi', 'sanskrit', 'persian', 'both'];

// Document types
const DOC_TYPES = [
  'Land Grant', 'Revenue Register', 'Survey Map', 'Court Judgment',
  'Temple Endowment', 'Gazette Order', 'Census Record', 'Manuscript',
  'Palace Record', 'Military Report', 'Inscription', 'Letter',
  'Government Order', 'Property Deed', 'Mutation Record', 'Boundary Report'
];

// Title prefixes
const TITLE_PREFIXES = [
  'Survey Settlement', 'Land Revenue', 'Property Sale', 'Court Judgment',
  'Temple Endowment', 'Gazette Notification', 'Census Enumeration',
  'Topographic Survey', 'Kannada Manuscript', 'Village Account',
  'Mutation Register', 'Khata Certificate', 'RTC Record', 'Writ Petition',
  'Appeal Judgment', 'Revenue Petition', 'Forest Settlement',
  'Municipal Tax', 'Boundary Demarcation', 'Patta Passbook',
  'Encumbrance Certificate', 'Sale Agreement', 'Gift Deed', 'Partition Deed',
  'Copper Plate Inscription', 'Freedom Fighter Record', 'Archaeological Survey',
  'Heritage Documentation', 'Temple Consecration', 'Palace Correspondence'
];

// Summary templates
const SUMMARY_TEMPLATES = [
  'Historical {doc_type} for {district} district from {year}. This record contains {page_count} pages of archival data documenting administrative procedures and local governance.',
  '{doc_type} registered in {district} during {year}. The document provides insights into land ownership, taxation, and community records of that era.',
  'Official {doc_type} from the {district} archives dated {year}. Contains {page_count} pages of handwritten records with {ocr_confidence}% average OCR confidence.',
  'Karnataka state archive record: {doc_type} for {district}, year {year}. This {page_count}-page document is part of the {category} collection.',
  'Historical manuscript of {doc_type} from {district} district, {year}. Document in {language} language with {page_count} pages.',
  'Administrative record: {doc_type} from {district}, {year}. Part of the Karnataka Digital Archive collection. {page_count} pages.',
  'Colonial-era {doc_type} for {district} district, {year}. Handwritten records documenting local governance and revenue administration.',
  'Royal {doc_type} from {district} under the Mysuru administration, {year}. {page_count}-page document with historical significance.',
  'District-level {doc_type} for {district}, {year}. Contains administrative records, signatures, and official stamps.',
  'Pre-independence {doc_type} from {district} district, {year}. {page_count} pages of historical records in {language} language.'
];

// Keywords
const KEYWORDS = [
  'karnataka', 'archives', 'historical', 'district', 'revenue', 'land',
  'government', 'administrative', 'manuscript', 'inscription', 'temple',
  'palace', 'military', 'freedom', 'colonial', 'survey', 'census',
  'gazette', 'court', 'judgment', 'endowment', 'record', 'document'
];

// Taluks per district
const TALUKS: Record<string, string[]> = {
  'Bengaluru Urban': ['Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Bengaluru West'],
  'Bengaluru Rural': ['Devanahalli', 'Doddaballapura', 'Hoskote', 'Nelamangala'],
  'Mysuru': ['Mysuru', 'Hunsur', 'K.R. Nagar', 'Nanjangud', 'Periyapatna', 'T. Narasipura'],
  'Belagavi': ['Belagavi', 'Chikkodi', 'Gokak', 'Hukkeri', 'Khanapur', 'Ramdurg', 'Saundatti', 'Athani', ' Bailhongal', 'Nippani'],
  'Dakshina Kannada': ['Mangaluru', 'Bantwal', 'Belthangady', 'Puttur', 'Sulya'],
  'Ballari': ['Ballari', 'Hospet', 'Kudligi', 'Sandur', 'Siruguppa', 'Hagaribommanahalli'],
  'Kalaburagi': ['Kalaburagi', 'Aland', 'Afzalpur', 'Chincholi', 'Chittapur', 'Jevargi', 'Sedam'],
  'Tumakuru': ['Tumakuru', 'Chikkanayakanahalli', 'Gubbi', 'Koratagere', 'Kunigal', 'Madhugiri', 'Pavagada', 'Sira', 'Tiptur', 'Turuvekere'],
  'Shivamogga': ['Shivamogga', 'Bhadravati', 'Hosanagara', 'Sagar', 'Shikaripur', 'Sorab', 'Thirthahalli'],
  'Vijayapura': ['Vijayapura', 'Basavana Bagewadi', 'Indi', 'Muddebihal', 'Sindagi'],
  'Hassan': ['Hassan', 'Alur', 'Arkalgud', 'Arsikere', 'Belur', 'Channarayapatna', 'Holenarsipur', 'Sakleshpur'],
  'Dharwad': ['Dharwad', 'Hubballi', 'Kalghatgi', 'Kundgol', 'Navalgund'],
  'Raichur': ['Raichur', 'Deodurga', 'Lingasugur', 'Manvi', 'Sindhanur'],
  'Chitradurga': ['Chitradurga', 'Challakere', 'Hiriyur', 'Holalkere', 'Hosadurga'],
  'Kodagu': ['Madikeri', 'Somwarpet', 'Virajpet'],
  'Mandya': ['Mandya', 'Krishnarajpet', 'Maddur', 'Malavalli', 'Nagamangala', 'Pandavapura', 'Srirangapatna'],
  'Udupi': ['Udupi', 'Brahmavara', 'Karkala', 'Kundapura', 'Hebri'],
  'Uttara Kannada': ['Karwar', 'Ankola', 'Bhatkal', 'Haliyal', 'Honnavar', 'Joida', 'Kumta', 'Mundgod', 'Siddapur', 'Sirsi', 'Yellapur'],
  'Kolar': ['Kolar', 'Bangarapet', 'KGF', 'Malur', 'Mulbagal', 'Srinivaspur'],
  'Chikkaballapur': ['Chikkaballapur', 'Bagepalli', 'Chintamani', 'Gauribidanur', 'Gudibande', 'Sidlaghatta'],
  'Gadag': ['Gadag', 'Mundargi', 'Nargund', 'Ron', 'Shirhatti'],
  'Haveri': ['Haveri', 'Byadgi', 'Hanagal', 'Hirekerur', 'Ranebennur', 'Savanur', 'Shiggaon'],
  'Koppal': ['Koppal', 'Gangavati', 'Kushtagi', 'Yelbarga'],
  'Yadgir': ['Yadgir', 'Gurmitkal', 'Shahpur', 'Shorapur', 'Wadi'],
  'Bidar': ['Bidar', 'Aurad', 'Basavakalyan', 'Bhalki', 'Chitguppa', 'Hulsoor', 'Humnabad'],
  'Bagalkot': ['Bagalkot', 'Badami', 'Bilagi', 'Hungund', 'Jamkhandi', 'Mudhol', 'Rabakavi Banahatti'],
  'Bijapur': ['Bijapur', 'Basavana Bagewadi', 'Indi', 'Muddebihal', 'Sindagi'],
  'Ramanagara': ['Ramanagara', 'Channapatna', 'Harohalli', 'Kanakapura', 'Magadi'],
  'Chikkamagaluru': ['Chikkamagaluru', 'Ajjampura', 'Kadur', 'Koppa', 'Mudigere', 'Narasimharajapura', 'Sringeri', 'Tarikere'],
  'Davanagere': ['Davanagere', 'Channagiri', 'Harihar', 'Honnali', 'Jagalur']
};

// Village names
const VILLAGES = [
  'Hosahalli', 'Keregodu', 'Kodihalli', 'Mallenahalli', 'Naganahalli',
  'Rangapura', 'Sannenahalli', 'Siddapura', 'Thimmanahalli', 'Vaderahalli',
  'Arakalgud', 'Bannur', 'Belakavadi', 'Gundlupet', 'Heggadadevanapura',
  'K.R. Nagar', 'Nanjangud', 'Periyapatna', 'Santemarahalli', 'T. Narasipura'
];

function generateStableId(index: number): string {
  return `sa-${index.toString().padStart(6, '0')}`;
}

function generateSampleArchive(index: number) {
  const district = DISTRICTS[index % DISTRICTS.length];
  const category = CATEGORIES[index % CATEGORIES.length];
  const language = LANGUAGES[index % LANGUAGES.length];
  const docType = DOC_TYPES[index % DOC_TYPES.length];
  const prefix = TITLE_PREFIXES[index % TITLE_PREFIXES.length];
  const year = 1500 + (index % 525);
  const pageCount = 2 + (index % 9);
  const ocrConfidence = 0.65 + (Math.sin(index * 0.1) * 0.3);
  const relevanceScore = 0.3 + (Math.cos(index * 0.15) * 0.6);
  const taluk = (TALUKS[district] || ['Taluk'])[index % (TALUKS[district]?.length || 1)];
  const village = VILLAGES[index % VILLAGES.length];
  
  const template = SUMMARY_TEMPLATES[index % SUMMARY_TEMPLATES.length];
  const summary = template
    .replace(/{doc_type}/g, docType)
    .replace(/{district}/g, district)
    .replace(/{year}/g, String(year))
    .replace(/{page_count}/g, String(pageCount))
    .replace(/{ocr_confidence}/g, String(Math.round(ocrConfidence * 100)))
    .replace(/{category}/g, category)
    .replace(/{language}/g, language);

  const keywords = [
    ...KEYWORDS.slice(index % 5, (index % 5) + 5),
    district.toLowerCase(),
    category.toLowerCase(),
    language,
    docType.toLowerCase()
  ];

  const title = `${prefix} — ${district}, ${year}`;
  
  return {
    id: generateStableId(index),
    title,
    description: summary,
    district,
    category,
    language,
    year,
    visibility: 'public',
    status: 'active',
    summary,
    keywords: [...new Set(keywords)],
    page_count: pageCount,
    average_ocr_confidence: Math.round(ocrConfidence * 100) / 100,
    source_type: 'sample_archive',
    source_name: 'Karnataka Archive Sample Collection',
    source_is_real: false,
    is_demo: false,
    collection_name: 'Karnataka Archive Sample Collection',
    document_type: docType,
    file_type: index % 3 === 0 ? 'pdf' : index % 3 === 1 ? 'image' : 'document',
    taluk,
    village,
    relevance_score: Math.round(relevanceScore * 100) / 100,
    has_ocr: true,
    has_embedding: false,
    access_level: 'public',
    view_count: Math.floor(Math.random() * 100),
    metadata: {
      sample_index: index,
      generated: true,
      batch_id: 'sample-archive-10k'
    }
  };
}

export async function POST(req: NextRequest) {
  const rateCheck = await checkRateLimit(req, { limit: 5, refillRate: 0.05 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  const supabase = createServerSupabaseClient();

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !['admin', 'archivist'].includes(profile.role)) {
    return NextResponse.json({ success: false, error: 'Admin or Archivist access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { count = 10000, batchSize = 100, startIndex = 0 } = body;
    const total = Math.min(count, 10000);
    const batch = Math.min(batchSize, 100);
    const start = Math.max(startIndex, 0);

    // Create ingestion batch record
    const { data: batchRecord } = await supabase
      .from('ingestion_batches')
      .insert({
        batch_name: `Sample Archive Collection ${start}-${start + total}`,
        batch_type: 'sample_archive',
        total_records: total,
        collection_name: 'Karnataka Archive Sample Collection',
        source_type: 'sample_archive'
      })
      .select('id')
      .single();

    const batchId = batchRecord?.id;
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = start; i < start + total; i += batch) {
      const batchRecords = [];
      for (let j = i; j < Math.min(i + batch, start + total); j++) {
        batchRecords.push(generateSampleArchive(j));
      }

      // Insert archives
      const { error: insertError } = await supabase
        .from('archives')
        .upsert(batchRecords, { onConflict: 'id', ignoreDuplicates: true });

      if (insertError) {
        failed += batchRecords.length;
        errors.push(`Batch ${i}-${i + batch}: ${insertError.message}`);
        console.error('Batch insert error:', insertError);
      } else {
        processed += batchRecords.length;

        // Insert dataset records
        if (batchId) {
          const datasetRecords = batchRecords.map((r, idx) => ({
            batch_id: batchId,
            archive_id: r.id,
            source_type: 'sample_archive',
            source_is_real: false,
            is_demo: false,
            collection_name: 'Karnataka Archive Sample Collection',
            seed_index: i + idx,
            metadata: { batch_index: i, generated: true }
          }));

          await supabase.from('dataset_records').insert(datasetRecords);
        }
      }
    }

    // Update batch status
    if (batchId) {
      await supabase
        .from('ingestion_batches')
        .update({
          processed_records: processed,
          failed_records: failed,
          status: failed > 0 ? (processed > 0 ? 'completed' : 'failed') : 'completed',
          completed_at: new Date().toISOString(),
          error_log: errors.length > 0 ? errors.slice(0, 10).join('\n') : null
        })
        .eq('id', batchId);
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total,
      batch_id: batchId,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      message: `Seeded ${processed} archive sample records. ${failed > 0 ? `${failed} failed.` : ''}`
    });

  } catch (err: any) {
    console.error('Seed error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Seed failed' }, { status: 500 });
  }
}
