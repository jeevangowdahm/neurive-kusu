import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/security/rate-limit';

const DISTRICTS = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Belagavi', 'Dakshina Kannada',
  'Ballari', 'Kalaburagi', 'Tumakuru', 'Shivamogga', 'Vijayapura',
  'Hassan', 'Dharwad', 'Raichur', 'Chitradurga', 'Kodagu',
  'Mandya', 'Udupi', 'Uttara Kannada', 'Kolar', 'Chikkaballapur',
  'Gadag', 'Haveri', 'Koppal', 'Yadgir', 'Bidar',
  'Bagalkot', 'Bijapur', 'Ramanagara', 'Chikkamagaluru', 'Davanagere'
];

const CATEGORIES = [
  'Land Records', 'Court Records', 'Temple Records', 'Gazette Notifications',
  'Manuscripts', 'Census Records', 'Maps & Surveys', 'Kannada Literature',
  'Revenue Records', 'Archaeological Records', 'Freedom Movement',
  'Administrative Records', 'Palace Records', 'Military Records',
  'Inscriptions', 'Government Orders'
];

const PDF_TITLES = [
  'Land Revenue Settlement PDF', 'Property Deed Document', 'Court Judgment Order',
  'Temple Endowment Grant PDF', 'Gazette Notification PDF', 'Census Record Sheet',
  'Topographic Survey Map PDF', 'Kannada Manuscript PDF', 'Palace Correspondence PDF',
  'Military Campaign Report PDF', 'Historical Inscription PDF', 'Government Order PDF',
  'Land Grant Certificate PDF', 'Mutation Register PDF', 'Khata Certificate PDF',
  'RTC Record PDF', 'Writ Petition PDF', 'Appeal Judgment PDF',
  'Forest Settlement PDF', 'Municipal Tax Register PDF'
];

const PDF_DESCRIPTIONS = [
  'Digitized PDF document from the Karnataka State Archives. Contains {page_count} pages of historical records.',
  'Archive PDF document for {district} district, year {year}. Contains administrative records and official signatures.',
  'Historical PDF record from {district}, {year}. Part of the Karnataka Archive PDF Collection.',
  'Digitized manuscript PDF from {district} district archives. {page_count} pages of {category} records.',
  'Karnataka Archive PDF Collection document: {category} for {district}, year {year}.',
  'Official PDF document from {district} district office, {year}. Contains {page_count} pages of administrative records.',
  'Historical PDF record from Karnataka archives. {district} district, {year}, {category} collection.',
  'Colonial-era PDF document for {district} district, {year}. Handwritten records with official stamps.',
  'Royal PDF document from {district} under Mysuru administration, {year}. {page_count} pages.',
  'District-level PDF document for {district}, {year}. Contains {category} records in Kannada and English.'
];

function generateStablePdfId(index: number): string {
  return `pdf-${index.toString().padStart(5, '0')}`;
}

function generatePdfRecord(index: number) {
  const district = DISTRICTS[index % DISTRICTS.length];
  const category = CATEGORIES[index % CATEGORIES.length];
  const title = PDF_TITLES[index % PDF_TITLES.length];
  const year = 1500 + (index % 525);
  const pageCount = 2 + (index % 9);
  const ocrConfidence = 0.65 + (Math.sin(index * 0.1) * 0.3);
  
  const template = PDF_DESCRIPTIONS[index % PDF_DESCRIPTIONS.length];
  const description = template
    .replace(/{district}/g, district)
    .replace(/{year}/g, String(year))
    .replace(/{page_count}/g, String(pageCount))
    .replace(/{category}/g, category);

  const id = generateStablePdfId(index);
  
  return {
    id,
    title: `${title} — ${district}, ${year}`,
    description,
    district,
    category,
    language: index % 3 === 0 ? 'kannada' : index % 3 === 1 ? 'english' : 'both',
    year,
    visibility: 'public',
    status: 'active',
    summary: description,
    keywords: ['karnataka', 'archives', 'pdf', district.toLowerCase(), category.toLowerCase()],
    page_count: pageCount,
    average_ocr_confidence: Math.round(ocrConfidence * 100) / 100,
    source_type: 'sample_pdf',
    source_name: 'Karnataka Archive PDF Sample Collection',
    source_is_real: false,
    is_demo: false,
    collection_name: 'Karnataka Archive PDF Sample Collection',
    document_type: title,
    file_type: 'pdf',
    file_url: `/api/pdf/${id}`,
    relevance_score: Math.round((0.3 + Math.cos(index * 0.15) * 0.6) * 100) / 100,
    has_ocr: true,
    has_embedding: false,
    access_level: 'public',
    view_count: Math.floor(Math.random() * 50),
    metadata: {
      pdf_index: index,
      generated: true,
      batch_id: 'sample-pdf-200'
    }
  };
}

function generatePdfPageText(documentId: string, pageNum: number, totalPages: number, district: string, year: number) {
  const contexts = [
    `Page ${pageNum} of ${totalPages}. This document from ${district} district, dated ${year}, contains official records and administrative details. The text is in Kannada and English.`,
    `Page ${pageNum}/${totalPages}. Historical record for ${district}, ${year}. Contains administrative procedures, signatures, and official stamps. Document is part of the Karnataka Archive PDF Collection.`,
    `Page ${pageNum} of ${totalPages}. ${district} district archive record from ${year}. Contains handwritten notes, official orders, and land revenue details.`,
    `Page ${pageNum}/${totalPages}. Archive document from ${district}, year ${year}. Document includes administrative records and historical data.`,
    `Page ${pageNum} of ${totalPages}. Karnataka archive PDF document for ${district} district, ${year}. Record contains official correspondence and administrative details.`
  ];
  return contexts[pageNum % contexts.length];
}

export async function POST(req: NextRequest) {
  const rateCheck = await checkRateLimit(req, { limit: 5, refillRate: 0.05 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = createServerSupabaseClient();
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
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { count = 200, startIndex = 0 } = body;
    const total = Math.min(count, 200);
    const start = Math.max(startIndex, 0);

    const { data: batchRecord } = await supabase
      .from('ingestion_batches')
      .insert({
        batch_name: `PDF Sample Collection ${start}-${start + total}`,
        batch_type: 'sample_pdf',
        total_records: total,
        collection_name: 'Karnataka Archive PDF Sample Collection',
        source_type: 'sample_pdf'
      })
      .select('id')
      .single();

    const batchId = batchRecord?.id;
    let processed = 0;
    let failed = 0;

    for (let i = start; i < start + total; i++) {
      const record = generatePdfRecord(i);
      
      const { error: insertError } = await supabase
        .from('archives')
        .upsert(record, { onConflict: 'id', ignoreDuplicates: true });

      if (insertError) {
        failed++;
        console.error('PDF insert error:', insertError);
        continue;
      }

      // Insert document_pages for each page
      const pages = [];
      for (let p = 1; p <= record.page_count; p++) {
        pages.push({
          id: `page-${record.id}-${p}`,
          document_id: record.id,
          page_number: p,
          extracted_text: generatePdfPageText(record.id, p, record.page_count, record.district, record.year),
          corrected_text: generatePdfPageText(record.id, p, record.page_count, record.district, record.year),
          correction_status: 'raw',
          ocr_confidence: record.average_ocr_confidence
        });
      }

      await supabase.from('document_pages').insert(pages);

      // Insert chunks
      const chunks = [];
      for (let p = 1; p <= record.page_count; p++) {
        chunks.push({
          id: `chunk-${record.id}-${p}`,
          document_id: record.id,
          page_number: p,
          chunk_text: generatePdfPageText(record.id, p, record.page_count, record.district, record.year).substring(0, 200),
          chunk_index: p - 1
        });
      }
      await supabase.from('document_chunks').insert(chunks);

      // Insert dataset record
      if (batchId) {
        await supabase.from('dataset_records').insert({
          batch_id: batchId,
          archive_id: record.id,
          source_type: 'sample_pdf',
          source_is_real: false,
          is_demo: false,
          collection_name: 'Karnataka Archive PDF Sample Collection',
          seed_index: i,
          metadata: { pdf_index: i, generated: true }
        });
      }

      processed++;
    }

    if (batchId) {
      await supabase
        .from('ingestion_batches')
        .update({
          processed_records: processed,
          failed_records: failed,
          status: failed > 0 ? (processed > 0 ? 'completed' : 'failed') : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total,
      batch_id: batchId,
      message: `Seeded ${processed} PDF sample records. ${failed > 0 ? `${failed} failed.` : ''}`
    });

  } catch (err: any) {
    console.error('PDF seed error:', err);
    return NextResponse.json({ success: false, error: err.message || 'PDF seed failed' }, { status: 500 });
  }
}
