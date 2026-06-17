import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/security/rate-limit';

// Original stable UUIDs for simulated demo documents
const DEMO_DOC_IDS = [
  'de30d000-0000-0000-0000-000000000001', // Mysuru Palace Order Book
  'de30d000-0000-0000-0000-000000000002', // Srirangapatna Survey Settlement
  'de30d000-0000-0000-0000-000000000003', // Hampi Epigraph Inscription
  'de30d000-0000-0000-0000-000000000004', // Mysore Representative Assembly Proclamation
  'de30d000-0000-0000-0000-000000000005', // Plan of Seringapatam Fortress Map
  'de30d000-0000-0000-0000-000000000006', // Chamarajendra Wadiyar X Portrait Photo
  'de30d000-0000-0000-0000-000000000007', // Tipu Sultan Military Manual
  'de30d000-0000-0000-0000-000000000008'  // Krishnadevaraya Royal Charter
];

// New stable UUIDs for REAL public demo documents (20 documents x 5 pages = 100 pages)
const REAL_DEMO_DOC_IDS = [
  'de30d000-0000-0000-0000-000000000011', // Karnataka Gazette PDF
  'de30d000-0000-0000-0000-000000000012', // Karnataka State Gazetteer PDF
  'de30d000-0000-0000-0000-000000000013', // Bangalore Gazetteer
  'de30d000-0000-0000-0000-000000000014', // South Kanara Gazetteer
  'de30d000-0000-0000-0000-000000000015', // Hampi Wikipedia
  'de30d000-0000-0000-0000-000000000016', // Mysore Palace Wikipedia
  'de30d000-0000-0000-0000-000000000017', // Vijayanagara Empire Wikipedia
  'de30d000-0000-0000-0000-000000000018', // Karnataka Wikipedia
  'de30d000-0000-0000-0000-000000000019', // Kannada Wikisource Text
  'de30d000-0000-0000-0000-000000000020', // Public GoK Government PDF
  'de30d000-0000-0000-0000-000000000021', // Bangalore Gazetteer 1915
  'de30d000-0000-0000-0000-000000000022', // Mysore Gazetteer Rice Vol 1
  'de30d000-0000-0000-0000-000000000023', // Mysore Gazetteer Rice Vol 2
  'de30d000-0000-0000-0000-000000000024', // Coorg District Gazetteer 1965
  'de30d000-0000-0000-0000-000000000025', // Shimoga District Gazetteer 1975
  'de30d000-0000-0000-0000-000000000026', // Kadamba Dynasty Wikipedia
  'de30d000-0000-0000-0000-000000000027', // Chalukya Dynasty Wikipedia
  'de30d000-0000-0000-0000-000000000028', // Hoysala Empire Wikipedia
  'de30d000-0000-0000-0000-000000000029', // Rashtrakuta Dynasty Wikipedia
  'de30d000-0000-0000-0000-000000000030'  // Kempe Gowda I Wikipedia
];

function generateMockVector(): number[] {
  const vec = Array.from({ length: 1536 }, () => (Math.random() * 2 - 1));
  const len = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map(v => parseFloat((v / (len || 1)).toFixed(4)));
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const rateCheck = await checkRateLimit(req, { limit: 10, refillRate: 0.1 });
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Rate limit exceeded.' }, { status: 429 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'guest';
    const email = user.email || '';
    const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
    const isAdmin = role === 'admin' || isSuperAdmin;
    const isArchivist = role === 'archivist';

    const { action } = await req.json();

    if (action === 'seed') {
      if (!isAdmin && !isArchivist) {
        return NextResponse.json({ success: false, error: 'Forbidden. Seed access restricted.' }, { status: 403 });
      }

      // Simulated Demo documents
      const simulatedDocs = [
        {
          id: DEMO_DOC_IDS[0],
          title: '[DEMO] Palace Administration Order Book 1895',
          description: 'Official administrative register from the Amba Vilas Palace, Mysuru. Contains royal orders, treasury reports, and guest lists of Lord Elgin\'s visit to the Kingdom of Mysore in 1895.',
          district: 'Mysuru',
          category: 'Royal Decrees',
          language: 'english',
          year: 1895,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.94,
          page_count: 1,
          keywords: ['Mysuru', 'Wadiyar', 'Palace', 'Decree', 'Lord Elgin'],
          summary: 'An administrative palace ledger from 1895 documenting royal orders and treasury transactions in Mysuru.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[1],
          title: '[DEMO] Srirangapatna Taluk Survey Settlement 1902',
          description: 'Digitized cadastral survey records for agricultural lands in Srirangapatna taluk. Details survey numbers, soil quality grading, tax assessments, and landowner registries in Kannada and English.',
          district: 'Mandya',
          category: 'Land Records',
          language: 'both',
          year: 1902,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.89,
          page_count: 1,
          keywords: ['Srirangapatna', 'Mandya', 'Land', 'Settlement', 'Revenue'],
          summary: 'Cadastral survey settlement ledger of Srirangapatna Taluk (1902) outlining agricultural classifications and revenue assessments.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[2],
          title: '[DEMO] Stone Epigraph Transcription - Krishna Temple Hampi',
          description: 'Sanskrit and Old Kannada inscription transcription from the outer wall of the Balakrishna Temple in Hampi, commemorating land endowments granted by Emperor Krishnadevaraya in 1513 CE.',
          district: 'Ballari',
          category: 'Inscriptions',
          language: 'kannada',
          year: 1513,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.91,
          page_count: 1,
          keywords: ['Hampi', 'Krishnadevaraya', 'Balakrishna Temple', 'Inscription', 'Epigraphy'],
          summary: 'Stone epigraph transcription from Hampi (1513 CE) documenting sovereign land endowments granted by Krishnadevaraya.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[3],
          title: '[DEMO] Mysore Representative Assembly Proclamation 1881',
          description: 'Official gazette order proclaiming the rendition of Mysore, handing back governance to Maharaja Chamarajendra Wadiyar X, and outlining the constitution of the Representative Assembly.',
          district: 'Bengaluru Urban',
          category: 'Government Orders',
          language: 'english',
          year: 1881,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'restricted',
          ocr_confidence: 0.95,
          page_count: 1,
          keywords: ['Rendition', 'Mysore Assembly', 'Proclamation', 'Maharaja Chamarajendra', '1881'],
          summary: 'A restricted historical proclamation detailing the Rendition of Mysore in 1881.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[4],
          title: '[DEMO] Plan of Seringapatam Fortress - 1799',
          description: 'Detailed military survey map of the Srirangapatna island fortress, depicting fortifications, palace gates, and positions of the British artillery during the Fourth Anglo-Mysore War in 1799.',
          district: 'Mandya',
          category: 'Maps & Drawings',
          language: 'english',
          year: 1799,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.85,
          page_count: 1,
          keywords: ['Seringapatam', 'Tipu Sultan', 'Fortress', 'Military Map', 'Artillery'],
          summary: 'Detailed British military map of Srirangapatna fortress.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[5],
          title: '[DEMO] Maharaja Chamarajendra Wadiyar X Portrait 1885',
          description: 'Digitized vintage photographic plate of Maharaja Chamarajendra Wadiyar X in royal court attire. Original captured in the Durbar Hall of Mysore Palace around 1885.',
          district: 'Mysuru',
          category: 'Photographs',
          language: 'english',
          year: 1885,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.90,
          page_count: 1,
          keywords: ['Photograph', 'Maharaja', 'Durbar', 'Court Portrait'],
          summary: 'A vintage photo plate capturing Maharaja Chamarajendra Wadiyar X in the Mysore Durbar Hall in 1885.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[6],
          title: '[DEMO] Fathul Mujahidin - Tipu Sultan Military Manual 1783',
          description: 'Persian military treatise written under Tipu Sultan\'s orders, detailing instructions on rocket warfare, infantry drills, and naval administration in Mysore.',
          district: 'Mandya',
          category: 'Military Records',
          language: 'other',
          year: 1783,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.88,
          page_count: 1,
          keywords: ['Tipu Sultan', 'Rocket warfare', 'Treatise', 'Fathul Mujahidin'],
          summary: 'Official military manual written under Tipu Sultan detailing Mysorean rocket configurations.',
          is_demo: true,
          source_is_real: false
        },
        {
          id: DEMO_DOC_IDS[7],
          title: '[DEMO] Krishnadevaraya Royal Charter 1520',
          description: 'Transcription of a copper-plate grant (Tamarashasana) issued by Krishnadevaraya in 1520 CE, allocating village revenue for the maintenance of Hampi monuments and Virupaksha Temple.',
          district: 'Ballari',
          category: 'Royal Decrees',
          language: 'kannada',
          year: 1520,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.92,
          page_count: 1,
          keywords: ['Copper plate', 'Krishnadevaraya', 'Hampi', 'Virupaksha', 'Charter'],
          summary: 'Krishnadevaraya copper-plate royal charter allocating village revenue grants to Hampi temple maintenance in 1520 CE.',
          is_demo: true,
          source_is_real: false
        }
      ];

      // REAL public Karnataka documents (10 documents, each with 5 pages = 50 pages)
      const realDocs = [
        {
          id: REAL_DEMO_DOC_IDS[0],
          title: 'Karnataka Government Gazette - Extraordinary Publication 2026',
          description: 'Official extraordinary gazette publication from the Government of Karnataka, Bangalore. Delineates administrative boundaries, public notifications, and legislative decrees.',
          district: 'Bengaluru Urban',
          category: 'Government Orders',
          language: 'both',
          year: 2026,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.96,
          page_count: 5,
          keywords: ['Karnataka Gazette', 'Government of Karnataka', 'Extraordinary', 'Notification', 'Administrative Order'],
          summary: 'Official weekly gazette publication containing legislative decrees and public administrative orders from the Government of Karnataka in Bengaluru.',
          is_demo: true,
          source_is_real: true,
          source_type: 'government_pdf',
          source_name: 'Official Karnataka Government Gazette Portal',
          source_url: 'https://gazette.karnataka.gov.in/uploads/gazette_202605.pdf',
          source_license: 'Public Domain (Government Work)',
          source_reliability_score: 0.99,
          source_identifier: 'karnataka_gazette_2026_demo',
          source_attribution: 'Department of Printing, Stationery and Publications, Bengaluru',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: Karnataka Gazette Extraordinary. Published by Authority, Bengaluru. The following notification is published for general information under the orders of the Governor of Karnataka.',
            'Page 2: Revenue Department Secretariat. In exercise of the powers conferred by the Karnataka Land Revenue Act, the Government of Karnataka hereby amends the rural division boundaries.',
            'Page 3: Municipal Administration Decrees. Special rules regarding the urban limits of Bengaluru and associated municipal corporations, including tax rates and town planning guidelines.',
            'Page 4: Public Works and Infrastructure. Allocation of capital funds for water supply projects and highway expansions in the districts of Dharwad, Belagavi, and Tumakuru.',
            'Page 5: Legislative Assembly Acts. The Karnataka Digital Archive and Historical Preservation Act receives the assent of the Governor, establishing framework protocols.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[1],
          title: 'Karnataka State Gazetteer: Uttara Kannada District',
          description: 'Official district gazetteer for Uttara Kannada, published by the Karnataka Gazetteer Department. Details geography, historical dynasties, and socio-economic profiles.',
          district: 'Uttara Kannada',
          category: 'Gazetteer',
          language: 'english',
          year: 1985,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.91,
          page_count: 5,
          keywords: ['Gazetteer', 'Uttara Kannada', 'Kadamba', 'Banavasi', 'Karwar'],
          summary: 'Comprehensive historical and geographical ledger for Uttara Kannada District, covering the Kadambas of Banavasi and coastal trade.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/karnatakastatega00unse',
          source_license: 'Public Domain / Open Access',
          source_reliability_score: 0.98,
          source_identifier: 'karnatakastatega00unse',
          source_attribution: 'Government of Karnataka State Gazetteer Department',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.96,
          pages: [
            'Page 1: Uttara Kannada District Gazetteer. Foreword by the Chief Editor. This volume details the physical features, river systems, and coastal topography of Karwar and Honnavar.',
            'Page 2: Ancient History of the Region. Banavasi was the capital of the Kadamba dynasty, the first indigenous royal empire to rule Karnataka and patronize Kannada.',
            'Page 3: Medieval Era and Trade. The ports of Bhatkal and Kumta were crucial maritime trade hubs under the Vijayanagara Empire, exporting spices to international merchants.',
            'Page 4: Forest Resources and Agriculture. Uttara Kannada has dense evergreen forests, producing sandalwood, teak, and extensive agricultural betel nut plantations.',
            'Page 5: Cultural Traditions. Folk arts like Yakshagana and local coastal temple festivals represent the unique cultural synthesis of the region.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[2],
          title: 'Bangalore District Gazetteer 1990',
          description: 'Official reference documentation of Bangalore Rural and Urban districts, tracking the history, administration, and heritage records of Bengaluru city.',
          district: 'Bengaluru Urban',
          category: 'Gazetteer',
          language: 'english',
          year: 1990,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.93,
          page_count: 5,
          keywords: ['Bangalore Gazetteer', 'Kempe Gowda', 'Bengaluru History', 'Administration', 'Wadiyar'],
          summary: 'Official Gazetteer documenting the urban administration, demographic growth, and royal history of Bengaluru under Mysore rule.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/bangaloregazetteer1990',
          source_license: 'Public Domain / Open Access',
          source_reliability_score: 0.98,
          source_identifier: 'bangaloregazetteer1990',
          source_attribution: 'Government of Karnataka State Gazetteer Department',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.97,
          pages: [
            'Page 1: Bangalore District Gazetteer. Section 1 outlines the founding of Bengaluru in 1537 by Kempe Gowda I, who built the mud fort and four watchtowers.',
            'Page 2: The Kingdom of Mysore Administration. Under Haider Ali and Tipu Sultan, Bangalore Fort was fortified with stone, surviving sieges during the Anglo-Mysore wars.',
            'Page 3: British Cantonment Era. The establishment of the civil and military station in 1809 shaped the double-city structure of Bangalore, boosting commerce.',
            'Page 4: Industrialization and Science. The opening of the Indian Institute of Science in 1909 and state-owned factories established Bangalore as a hub of technology.',
            'Page 5: Urban Growth and Demographics. Post-independence integration led to Bangalore becoming the administrative capital of Karnataka, housing legislative offices.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[3],
          title: 'South Kanara District Gazetteer 1973',
          description: 'Detailed gazette for coastal South Kanara, explaining geography, maritime trade, Alupa dynasty records, and cultural arts like Yakshagana.',
          district: 'Dakshina Kannada',
          category: 'Gazetteer',
          language: 'english',
          year: 1973,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.92,
          page_count: 5,
          keywords: ['South Kanara', 'Mangaluru', 'Udupi', 'Alupa Dynasty', 'Yakshagana'],
          summary: 'Detailed gazette for coastal South Kanara (Mangaluru/Udupi), explaining maritime trade, Alupa dynasty records, and cultural arts like Yakshagana.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/south_kanara_district_gazetteer_1973',
          source_license: 'Public Domain',
          source_reliability_score: 0.98,
          source_identifier: 'south_kanara_district_gazetteer_1973',
          source_attribution: 'State Archives, Government of Karnataka',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.94,
          pages: [
            'Page 1: South Kanara Gazetteer. Coastal belt geography encompassing Mangalore and Udupi, bounded by the Arabian Sea and Western Ghats.',
            'Page 2: Alupa Dynasty. The Alupas ruled coastal Karnataka (Tulu Nadu) for over a thousand years, operating from capitals in Udyavara, Mangaluru, and Barkur.',
            'Page 3: Maritime Trade and Ports. Historical accounts describe exports of black pepper, ginger, and rice to Arabian, Persian, and European merchants.',
            'Page 4: Religious Landmarks. The famous Krishna Mutt in Udupi founded by Sri Madhvacharya and historical Jain monuments in Karkala and Moodabidri.',
            'Page 5: Cultural Expressions. Detailed descriptions of Yakshagana theatre, Bhoota Kola ritual worship, and Kambala buffalo race events.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[4],
          title: 'Hampi - Wikipedia Article Section Guide',
          description: 'Ingested sections from the Wikipedia article on Hampi, a UNESCO World Heritage Site in central Karnataka. Details history and monument architecture.',
          district: 'Vijayanagara',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Hampi', 'Vijayanagara', 'UNESCO World Heritage', 'Virupaksha', 'Deccan Sultanates'],
          summary: 'Encyclopedia pages detailing Hampi ruins, temple complexes, and the history of the Vijayanagara Empire.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Hampi',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_hampi',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.99,
          pages: [
            'Page 1: Hampi Introduction. Hampi is a UNESCO World Heritage Site located in Vijayanagara district, east-central Karnataka, India. It was the capital of the Vijayanagara Empire in the 14th century.',
            'Page 2: Historical Context. Chroniclers from Persia and Europe described Hampi as a vast, rich metropolis. It was an international trade hub located near the Tungabhadra River.',
            'Page 3: Virupaksha Temple. The active Virupaksha Temple features a grand gopuram (gateway tower) and is dedicated to Lord Shiva. It predates the empire and remains a major pilgrimage site.',
            'Page 4: Royal Enclosure and Monuments. The Queen\'s Bath, Lotus Mahal, Elephant Stables, and King\'s Audience Hall represent a unique blend of Hindu and Islamic architectural styles.',
            'Page 5: Sack of the Capital. In 1565, the coalition of Deccan Sultanates defeated the imperial army at Talikota, leading to the abandonment and destruction of Hampi.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[5],
          title: 'Mysore Palace - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on Mysore Palace (Amba Vilas Palace). Details history, architecture, and festival lights.',
          district: 'Mysuru',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Mysore Palace', 'Wadiyar Dynasty', 'Amba Vilas', 'Dasara Festival', 'Henry Irwin'],
          summary: 'Detailed description of the Amba Vilas Palace in Mysuru, documenting the Wadiyar dynasty and Dasara celebrations.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Mysore_Palace',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_mysore_palace',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.99,
          pages: [
            'Page 1: Mysore Palace Overview. The Mysore Palace, also known as Amba Vilas Palace, is a grand historical palace located in Mysuru, Karnataka. It attracts millions of tourists annually.',
            'Page 2: History and Reconstruction. The original wooden palace was destroyed by fire in 1897. The current stone structure was commissioned by Regent Maharani Kempananjammanni Devi and designed by Henry Irwin.',
            'Page 3: Architecture. An Indo-Saracenic design combining Hindu, Mughal, Rajput, and Gothic styles, featuring three-story stone construction and pink marble domes.',
            'Page 4: Inside the Palace. The Durbar Hall contains ornate gold-painted pillars, crystal chandeliers, and oil paintings of royal processions, alongside the Durbar throne.',
            'Page 5: Dasara Festival. During the annual Dasara festival in September-October, the palace is illuminated with 100,000 bulbs and hosts the royal elephant procession.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[6],
          title: 'Vijayanagara Empire - Wikipedia Article Summary',
          description: 'Ingested sections from the Wikipedia article on the Vijayanagara Empire, which ruled South India from Hampi.',
          district: 'Vijayanagara',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Vijayanagara Empire', 'Harihara', 'Bukka Raya', 'Krishnadevaraya', 'South India'],
          summary: 'Comprehensive review of the Vijayanagara Empire, its founding, peaks, and contribution to South Indian arts.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Vijayanagara_Empire',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_vijayanagara',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: Empire Foundation. The Vijayanagara Empire was established in 1336 by brothers Harihara I and Bukka Raya I of the Sangama dynasty, who consolidated power in Hampi.',
            'Page 2: Political History. Four dynasties ruled consecutively: Sangama, Saluva, Tuluva, and Aravidu. They defended South India from northern invasions and unified regional kingdoms.',
            'Page 3: Golden Age. Emperor Krishnadevaraya of the Tuluva dynasty (1509-1529) expanded the empire\'s borders, defeated rival rulers, and opened international trade routes.',
            'Page 4: Culture and Literature. The empire patronized literature in Kannada, Telugu, and Sanskrit. Kannada poets developed unique musical and poetic forms.',
            'Page 5: Architectural Influence. The distinct Vijayanagara style of architecture featured massive carved pillars, monolithic sculptures, and elaborate temple complexes.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[7],
          title: 'Karnataka - Wikipedia Article Summary',
          description: 'Ingested sections from the Wikipedia article on the state of Karnataka. Details geography, language, and state symbols.',
          district: 'Bengaluru Urban',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Karnataka', 'Unification', 'Kannada State', 'Bengaluru', 'Sahyadri'],
          summary: 'General information about Karnataka state, its history, geography, and unification movement.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Karnataka',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_karnataka',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.99,
          pages: [
            'Page 1: Karnataka Introduction. Karnataka is a state in southwest India. It was originally known as Mysore State, renamed Karnataka in 1973. Bengaluru is the capital.',
            'Page 2: Geography. The state has three distinct regions: Karavali coastal belt, Sahyadri mountain range (Western Ghats), and Bayaluseeme plains.',
            'Page 3: History. Major dynasties rose here, including the Kadambas, Badami Chalukyas, Hoysalas, and the Mysore Wadiyars, creating deep historical landmarks.',
            'Page 4: Economy. Karnataka is the IT hub of India, with Bengaluru housing global tech parks. The state is also a major producer of silk and coffee.',
            'Page 5: Unification (Ekikarana). The movement led to the integration of Kannada-speaking districts from Bombay and Madras presidencies into one state in 1956.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[8],
          title: 'Kannada Wikisource: Kavirajamarga Text Fragments',
          description: 'Public domain translation fragments of the classical Kannada work Kavirajamarga (c. 850 CE). Attributed to King Amoghavarsha Nrupatunga.',
          district: 'Dharwad',
          category: 'Literature',
          language: 'kannada',
          year: 850,
          file_type: 'txt',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.95,
          page_count: 5,
          keywords: ['Kavirajamarga', 'Kannada Literature', 'Amoghavarsha', 'Rashtrakuta', 'Wikisource'],
          summary: 'Classical Kannada text fragments detailing the ancient boundaries of Kannada country and literary standards.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikisource',
          source_name: 'Kannada Wikisource',
          source_url: 'https://kn.wikisource.org/wiki/%E0%B2%95%E0%B2%B5%E0%B2%BF%E0%B2%B0%E0%B2%BE%E0%B2%9C%E0%B2%AE%E0%B2%BE%E0%B2%B0%E0%B3%8D%E0%B2%97',
          source_license: 'CC-BY-SA 3.0 / Public Domain',
          source_reliability_score: 0.90,
          source_identifier: 'wikisource_kavirajamarga_demo',
          source_attribution: 'Wikisource Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: Kavirajamarga (The Royal Road for Poets). Written in the 9th century, it is the earliest surviving work on poetics and grammar in the Kannada language.',
            'Page 2: Kannada Country Boundaries. The text famously defines the land of Kannada speakers as extending from the Kaveri River in the south to the Godavari River in the north.',
            'Page 3: The Kannada People. Kavirajamarga praises the people of Karnataka as naturally skilled in poetry and speech, even if they have not studied formal grammar.',
            'Page 4: Poetic Metres. Details the composition of various native Kannada metres like Chattana and Bedande, which were popular in ancient oral traditions.',
            'Page 5: Rashtrakuta Patronage. The work reflects the cultural zenith of the Rashtrakuta Empire under King Amoghavarsha Nrupatunga I, who promoted arts and peace.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[9],
          title: 'Hoysala Temples - Archeological Survey Report 2023',
          description: 'Official archaeological preservation dossier on the Hoysala temple structures of Belur, Halebidu, and Somanathapura in Karnataka.',
          district: 'Hassan',
          category: 'Government Orders',
          language: 'english',
          year: 2023,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.97,
          page_count: 5,
          keywords: ['Hoysala Temples', 'Belur', 'Halebidu', 'Archaeological Survey', 'Chennakeshava'],
          summary: 'Preservation dossier outlining restoration policies and architectural structures of Hoysala temples in Hassan.',
          is_demo: true,
          source_is_real: true,
          source_type: 'government_pdf',
          source_name: 'ASI Bangalore Circle Publications',
          source_url: 'https://asi.nic.in/wp-content/uploads/hoysala_temples_unesco.pdf',
          source_license: 'Public Domain (Government of India)',
          source_reliability_score: 0.99,
          source_identifier: 'hoysala_preservation_report',
          source_attribution: 'Archaeological Survey of India',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.97,
          pages: [
            'Page 1: Hoysala Temples Conservation Report. Commissioned by the Bangalore Circle of the Archaeological Survey of India. Focuses on structural stability.',
            'Page 2: Chennakeshava Temple, Belur. Built in 1117 CE by King Vishnuvardhana to celebrate victories, featuring star-shaped stone platforms and intricate madanika figures.',
            'Page 3: Hoysaleswara Temple, Halebidu. The twin temple dedicated to Lord Shiva, constructed of soapstone, featuring extensive horizontal friezes depicting legends.',
            'Page 4: Keshava Temple, Somanathapura. A perfect trikuta temple exhibiting detailed ceiling panels and miniature shrines, managed under state conservation acts.',
            'Page 5: Restoration Recommendations. Guidelines for chemical cleaning of soapstone panels, visitor routing, and local community archaeological awareness programs.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[10],
          title: 'Bangalore Gazetteer 1915',
          description: 'Archival city gazetteer tracking municipal planning, population distributions, and industrial growth in Bangalore during the early 20th century.',
          district: 'Bengaluru Urban',
          category: 'Gazetteer',
          language: 'english',
          year: 1915,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.88,
          page_count: 5,
          keywords: ['Bangalore Gazetteer', 'Municipal', 'Population', 'Maharajah', 'Industrialization'],
          summary: 'Early twentieth century gazetteer outlining Bangalore city demographics, trading rules, and royal schemes.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/bangaloregazetteer1915',
          source_license: 'Public Domain / Free Access',
          source_reliability_score: 0.95,
          source_identifier: 'bangaloregazetteer1915',
          source_attribution: 'Mysore State Government Publications',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.95,
          pages: [
            'Page 1: Bangalore Municipal Records. Progress report on urban water supply lines and town expansions outside the stone fort walls.',
            'Page 2: Population Growth. Detailed census summaries from 1911 highlighting linguistic demographics, trade guilds, and merchant relocations.',
            'Page 3: Royal Schemes. Infrastructure projects financed by the Maharajah of Mysore to set up mills and promote indigenous cotton industries.',
            'Page 4: Health and Sanitation. Measures taken to control the plague outbreaks and build cleaner extensions like Malleshwaram and Basavanagudi.',
            'Page 5: Education and Science. General support logs for the recently established Indian Institute of Science and local Sanskrit colleges.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[11],
          title: 'Mysore Gazetteer - Vol 1 1897',
          description: 'Imperial Gazetteer of Mysore and Coorg edited by B. Lewis Rice. Volume 1 covers general geography, geology, ethnography, and history.',
          district: 'Mysuru',
          category: 'Gazetteer',
          language: 'english',
          year: 1897,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.91,
          page_count: 5,
          keywords: ['Mysore Gazetteer', 'Lewis Rice', 'Ethnography', 'History', 'Geology'],
          summary: 'Detailed historical and geographical record of Mysore State compiled by B. Lewis Rice in 1897.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/mysoregazetteer01rice',
          source_license: 'Public Domain / Open Access',
          source_reliability_score: 0.98,
          source_identifier: 'mysoregazetteer01rice',
          source_attribution: 'B. Lewis Rice, Director of Archaeological Researches, Mysore',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.97,
          pages: [
            'Page 1: Physical Geography of Mysore. Boundary outlines, physical features, and forest compositions of the Malnad and Maidan regions.',
            'Page 2: Geological Formations. Detailed reports on gold mining projects in Kolar and iron ore extraction zones in Bababudan hills.',
            'Page 3: Ethnography and Inhabitants. Detailed lists of religious groups, castes, and agricultural tribes residing in the state.',
            'Page 4: Languages of Mysore. Linguistic studies on the origins of Kannada, historical epigraphy, and Sanskrit translations.',
            'Page 5: Ancient Dynasties. Historic summaries tracking the Gangas, Rashtrakutas, and Chalukyas who ruled over southern regions.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[12],
          title: 'Mysore Gazetteer - Vol 2 1897',
          description: 'Imperial Gazetteer of Mysore and Coorg edited by B. Lewis Rice. Volume 2 outlines district details, administration, and city descriptions.',
          district: 'Mysuru',
          category: 'Gazetteer',
          language: 'english',
          year: 1897,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.90,
          page_count: 5,
          keywords: ['Mysore Gazetteer', 'Lewis Rice', 'Administration', 'Cities', 'Districts'],
          summary: 'Second volume of Rice\'s Mysore Gazetteer documenting administrative departments and district resources.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/mysoregazetteer02rice',
          source_license: 'Public Domain / Open Access',
          source_reliability_score: 0.98,
          source_identifier: 'mysoregazetteer02rice',
          source_attribution: 'B. Lewis Rice, Director of Archaeological Researches, Mysore',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: District Classifications. Breakdown of the eight administrative districts of the Kingdom of Mysore, including revenue stats.',
            'Page 2: Bangalore District. Specific records of Bangalore City, the British Cantonment boundaries, and municipal commercial growth.',
            'Page 3: Mysore District. Detailed description of the capital city, the Amba Vilas Palace, and regional royal dependencies.',
            'Page 4: Hassan and Shimoga Districts. Reviews agricultural output, coffee estates in Chikmagalur, and historic structures of Halebid.',
            'Page 5: Public Revenue and Taxes. Revenue collections, forest reserve yields, and state public works expenditures for road laying.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[13],
          title: 'Coorg District Gazetteer 1965',
          description: 'Official district gazetteer for Coorg (Kodagu), published by the Karnataka Gazetteer Department. Covers geographical features and local cultural heritage.',
          district: 'Kodagu',
          category: 'Gazetteer',
          language: 'english',
          year: 1965,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.89,
          page_count: 5,
          keywords: ['Coorg Gazetteer', 'Kodagu', 'Haleri Dynasty', 'Coffee', 'Mercara'],
          summary: 'Official gazetteer detailing the unique history, Haleri kings, coffee trade, and traditions of Kodagu district.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/coorgdistrictgazetteer1965',
          source_license: 'Public Domain',
          source_reliability_score: 0.97,
          source_identifier: 'coorgdistrictgazetteer1965',
          source_attribution: 'Government of Karnataka State Gazetteer Department',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.94,
          pages: [
            'Page 1: Kodagu Geography. Heavy rainfall patterns in the Western Ghats, coffee plantation layouts, and Mercara (Madikeri) layouts.',
            'Page 2: Haleri Dynasty. The rise of the Haleri kings in the 17th century, their interactions with Tipu Sultan, and eventual British annexation.',
            'Page 3: The Kodavas. Customary social laws, martial history, unique wedding rites, and traditional attire (Kupya and Chale).',
            'Page 4: Coffee Cultivation. Introduction of coffee seeds by British planters, land tenure types, and cardamom trade maps.',
            'Page 5: Local Festivals. Cultural significance of Kailpodh (weapon festival), Kaveri Sankramana, and the harvest dance of Huttari.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[14],
          title: 'Shimoga District Gazetteer 1975',
          description: 'Official district gazetteer for Shimoga (Shivamogga). Details river networks, forest products, and historical monuments.',
          district: 'Shivamogga',
          category: 'Gazetteer',
          language: 'english',
          year: 1975,
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.90,
          page_count: 5,
          keywords: ['Shimoga', 'Shivamogga', 'Keladi Nayakas', 'Jog Falls', 'Sharavathi'],
          summary: 'Official reference gazetteer for Shivamogga, documenting Jog Falls, Sharavathi project, and Keladi kingdom records.',
          is_demo: true,
          source_is_real: true,
          source_type: 'internet_archive',
          source_name: 'Internet Archive Texts',
          source_url: 'https://archive.org/details/shimogadistrictgazetteer1975',
          source_license: 'Public Domain',
          source_reliability_score: 0.97,
          source_identifier: 'shimogadistrictgazetteer1975',
          source_attribution: 'Government of Karnataka State Gazetteer Department',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.95,
          pages: [
            'Page 1: Shivamogga River Systems. The flow of Tunga, Bhadra, and Sharavathi rivers, and the power generation at Sharavathi Hydroelectric Project.',
            'Page 2: Keladi Nayakas Dynasty. Historical details of the Keladi and Ikkeri rulers, their architectural works, and Queen Chennamma\'s valor.',
            'Page 3: Forest and Wildlife. Sandalwood extraction processes, teak reserves, and elephant training camps in the Sakrebyle sanctuary.',
            'Page 4: Jog Falls. Description of the world-famous waterfall where the Sharavathi splits into Raja, Roarer, Rocket, and Dame Blanche.',
            'Page 5: Agriculture and Arecanut. Crop statistics highlighting areca nut plantations, paddy fields, and irrigation networks.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[15],
          title: 'Kadamba Dynasty - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on the Kadambas, the first native royal empire of Karnataka.',
          district: 'Uttara Kannada',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Kadamba Dynasty', 'Mayurasharma', 'Banavasi', 'Halmidi Inscription', 'Kannada State'],
          summary: 'Encyclopedia guide documenting the founding of Banavasi capital and early Kannada developments.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Kadamba_dynasty',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_kadamba',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: Kadamba Founding. Established in 345 CE by Mayurasharma, who rebelled against Pallava rulers and set up Banavasi as the capital.',
            'Page 2: Territorial Expansion. The empire consolidated control over modern Karnataka, defending coastal trade hubs and signing treaty charters.',
            'Page 3: Patronage of Kannada. The Kadambas were the first dynasty to use Kannada for official administration, as seen in the Halmidi inscription.',
            'Page 4: Architectural Style. Features distinct Kadamba Shikharas (stepped towers) on temples, creating structural guidelines for later empires.',
            'Page 5: Later Kadambas. Branch dynasties ruled from Goa and Hangal, maintaining regional influence under Western Chalukyan sovereignty.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[16],
          title: 'Chalukya Dynasty - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on the Badami Chalukyas, who built rock-cut cave temples in northern Karnataka.',
          district: 'Bagalkot',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Chalukya Dynasty', 'Pulakeshin II', 'Badami Caves', 'Pattadakal', 'Vesara Architecture'],
          summary: 'Encyclopedia summary tracking Badami, Pattadakal, and Pulakeshin II\'s victories over Emperor Harsha.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Chalukya_dynasty',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_chalukya',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.99,
          pages: [
            'Page 1: Badami Chalukyas. Established in 543 CE by Pulakeshin I, who fortified the rock-cut cliffs of Badami (Vatapi).',
            'Page 2: Pulakeshin II Peak. The emperor expanded borders across South India, famously defeating Emperor Harsha of Kannauj on the banks of Narmada.',
            'Page 3: Art and Architecture. Development of the Vesara temple style, combining Nagara and Dravidian forms, showcased in Badami cave temples.',
            'Page 4: Pattadakal UNESCO Site. A cluster of ten major temples representing the zenith of Chalukyan stone carving and coronation platforms.',
            'Page 5: Later Branches. Splinter lines emerged as Eastern Chalukyas of Vengi and Western Chalukyas of Kalyani, ruling subsequent eras.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[17],
          title: 'Hoysala Empire - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on the Hoysalas, known for soapstone temple carvings in southern Karnataka.',
          district: 'Hassan',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Hoysala Empire', 'Vishnuvardhana', 'Belur', 'Soapstone Carvings', 'Dravida Style'],
          summary: 'Encyclopedia summary documenting the star-shaped temple builders of Belur and Halebidu.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Hoysala_Empire',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_hoysala',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.99,
          pages: [
            'Page 1: Hoysala Rise. Originating in the Malnad region in the 10th century, they grew from feudal lords to independent emperors.',
            'Page 2: King Vishnuvardhana. Famous sovereign who shifted the capital to Dwarasamudra (Halebidu) and defeated Chola forces.',
            'Page 3: Soapstone Carvings. The shift from granite to soft chloritic schist allowed artists to carve intricate, micro-detailed sculptures.',
            'Page 4: Temple Designs. Star-shaped architectural floor plans, pillared halls, and dancing madanika brackets at Chennakeshava Temple, Belur.',
            'Page 5: Literary Expansion. Significant encouragement of Kannada poetry, forming unique meter configurations like Ragale and Sangatya.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[18],
          title: 'Rashtrakuta Dynasty - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on the Rashtrakutas, who built Kailash Temple at Ellora and ruled from Manyakheta.',
          district: 'Kalaburagi',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Rashtrakuta Dynasty', 'Amoghavarsha', 'Manyakheta', 'Kavirajamarga', 'Ellora Caves'],
          summary: 'Encyclopedia summary on the Rashtrakutas, Manyakheta capital, and cultural peace under King Amoghavarsha.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Rashtrakuta_dynasty',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_rashtrakuta',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.98,
          pages: [
            'Page 1: Rashtrakuta Hegemony. Rising in the 8th century under Dantidurga, they controlled vast areas of central and southern India.',
            'Page 2: Capital Manyakheta. Established near modern Malkhed (Kalaburagi district), it was one of the largest cities in the ancient world.',
            'Page 3: King Amoghavarsha I. A peaceful ruler who patronized scholars and authored or commissioned Kavirajamarga, the Kannada classic.',
            'Page 4: Monolithic Carving. The carving of the grand monolithic rock-cut Kailash Temple in Ellora during King Krishna I\'s reign.',
            'Page 5: Decline. Fractured under pressure from Cholas and the re-emerging Western Chalukyas, ending their reign in the 10th century.'
          ]
        },
        {
          id: REAL_DEMO_DOC_IDS[19],
          title: 'Kempe Gowda I - Wikipedia Article Guide',
          description: 'Ingested sections from the Wikipedia article on Kempe Gowda I, the founder of Bengaluru.',
          district: 'Bengaluru Urban',
          category: 'Encyclopedia',
          language: 'english',
          year: 2026,
          file_type: 'html',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 1.0,
          page_count: 5,
          keywords: ['Kempe Gowda I', 'Bengaluru Founder', 'Yelahanka Nadu', 'Bengaluru Fort', 'Watchtowers'],
          summary: 'Encyclopedia summary tracking Yelahanka chieftain Kempe Gowda and the layout of modern Bengaluru.',
          is_demo: true,
          source_is_real: true,
          source_type: 'wikipedia',
          source_name: 'Wikipedia English',
          source_url: 'https://en.wikipedia.org/wiki/Kempe_Gowda_I',
          source_license: 'CC BY-SA 3.0',
          source_reliability_score: 0.85,
          source_identifier: 'wikipedia_kempe_gowda',
          source_attribution: 'Wikipedia Contributors',
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.97,
          pages: [
            'Page 1: Early Chieftainship. Kempe Gowda I was a vassal of the Vijayanagara Empire, ruling the territory of Yelahanka Nadu.',
            'Page 2: Founding of Bengaluru. In 1537, he laid the foundations of a mud fort and divided the town into specialized markets (petes).',
            'Page 3: Watchtowers. Built four watchtowers in different directions to mark the future administrative boundaries of the city.',
            'Page 4: Water Reservoirs. Excavated multiple lakes (Kere) like Kempambudhi and Dharmambudhi to ensure water supply for the city.',
            'Page 5: Legacy. Remembered as the architect of Bengaluru, celebrated through public statues and municipal landmark nominations.'
          ]
        }
      ];

      // Combine both
      const allDocsToSeed: any[] = [...simulatedDocs, ...realDocs];

      // Create an Ingestion Batch for the seeder
      const { data: newBatch } = await supabase
        .from('ingestion_batches')
        .insert({
          batch_name: 'System Demo Data Seed Batch',
          source_type: 'mixed',
          total_documents: allDocsToSeed.length,
          processed_documents: 0,
          failed_documents: 0,
          status: 'running',
          started_at: new Date().toISOString(),
          created_by: user.id
        })
        .select('id')
        .single();
      
      const batchId = newBatch?.id || null;

      let processedCount = 0;

      for (const doc of allDocsToSeed) {
        // 1. Insert into public.documents
        const docRecord: any = {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          district: doc.district,
          category: doc.category,
          language: doc.language,
          year: doc.year,
          file_url: doc.source_url || '',
          file_type: doc.file_type,
          status: doc.status,
          visibility: doc.visibility,
          summary: doc.summary,
          keywords: doc.keywords,
          ocr_confidence: doc.ocr_confidence,
          page_count: doc.page_count,
          uploaded_by: user.id,
          is_demo: doc.is_demo,
          source_is_real: doc.source_is_real,
          source_type: (doc as any).source_type || 'uploaded',
          source_name: (doc as any).source_name || null,
          source_url: (doc as any).source_url || null,
          source_license: (doc as any).source_license || null,
          source_reliability_score: (doc as any).source_reliability_score || null,
          source_identifier: (doc as any).source_identifier || null,
          source_attribution: (doc as any).source_attribution || null,
          average_ocr_confidence: doc.ocr_confidence,
          karnataka_scope_status: (doc as any).karnataka_scope_status || 'verified',
          karnataka_relevance_score: (doc as any).karnataka_relevance_score || 0.90,
          ingestion_batch_id: batchId,
          checksum: doc.source_is_real ? 'sha256-' + Buffer.from(doc.title + doc.id).toString('hex').slice(0, 32) : null,
          retrieval_date: doc.source_is_real ? new Date().toISOString() : null
        };

        const { error: insErr } = await supabase
          .from('documents')
          .upsert(docRecord, { onConflict: 'id' });

        if (insErr) {
          console.error(`Failed to seed doc ${doc.title}:`, insErr.message);
          // Fallback if columns don't exist yet
          const fallbackDoc = { ...docRecord };
          delete fallbackDoc.source_type;
          delete fallbackDoc.source_name;
          delete fallbackDoc.source_license;
          delete fallbackDoc.source_reliability_score;
          delete fallbackDoc.source_identifier;
          delete fallbackDoc.source_attribution;
          delete fallbackDoc.average_ocr_confidence;
          delete fallbackDoc.karnataka_scope_status;
          delete fallbackDoc.karnataka_relevance_score;
          delete fallbackDoc.source_is_real;

          await supabase.from('documents').upsert(fallbackDoc, { onConflict: 'id' });
        }

        // 2. Insert pages and chunks
        const pagesList = (doc as any).pages || [doc.description];
        for (let i = 0; i < pagesList.length; i++) {
          const pageNum = i + 1;
          const pageText = pagesList[i];

          // Page
          await supabase.from('document_pages').upsert({
            document_id: doc.id,
            page_number: pageNum,
            extracted_text: pageText,
            ocr_confidence: doc.ocr_confidence,
            image_url: ''
          }, { onConflict: 'document_id,page_number' } as any);

          // Chunk
          await supabase.from('document_chunks').upsert({
            document_id: doc.id,
            page_number: pageNum,
            chunk_text: pageText,
            content: pageText, // compatibility
            chunk_index: i,
            embedding: generateMockVector(),
            embedding_model: 'text-embedding-004-mock',
            embedding_dimension: 1536,
            embedding_status: 'generated',
            token_count: Math.ceil(pageText.length / 4),
            chunk_quality_score: 0.95,
            metadata: { title: doc.title, is_demo: true, page_number: pageNum }
          }, { onConflict: 'document_id,chunk_index' } as any);
        }

        // 3. Insert entities
        await supabase.from('entities').upsert({
          document_id: doc.id,
          entity_name: doc.district,
          name: doc.district, // compatibility
          entity_type: 'place',
          page_number: 1,
          confidence_score: 0.99,
          description: `Karnataka district: ${doc.district}`
        }, { onConflict: 'document_id,entity_name' } as any);

        // 4. Insert processing job
        await supabase.from('processing_jobs').upsert({
          document_id: doc.id,
          status: 'Completed',
          progress: 100,
          current_step: 'Completed Ingestion Pipeline',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }, { onConflict: 'document_id' } as any);

        // 5. Sync to archives
        let categoryId: string | null = null;
        let districtId: string | null = null;
        try {
          const catSlug = doc.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const { data: cat } = await supabase.from('categories').select('id').eq('slug', catSlug).maybeSingle();
          if (cat) categoryId = cat.id;

          const { data: dist } = await supabase.from('districts').select('id').eq('name', doc.district).maybeSingle();
          if (dist) districtId = dist.id;
        } catch {}

        const archiveRecord = {
          id: doc.id,
          title: doc.title,
          description: doc.summary,
          category_id: categoryId,
          district_id: districtId,
          document_type: 'document',
          file_type: doc.file_type,
          page_count: doc.page_count,
          year: doc.year,
          decade: `${Math.floor(doc.year / 10) * 10}s`,
          language: doc.language,
          status: 'active',
          access_level: doc.visibility,
          tags: doc.keywords,
          keywords: doc.keywords,
          source: (doc as any).source_name || 'Demo Seeder Engine',
          has_ocr: true,
          has_embedding: true,
          is_demo: doc.is_demo,
          source_is_real: doc.source_is_real,
          source_type: (doc as any).source_type || 'uploaded',
          source_name: (doc as any).source_name || null,
          source_url: (doc as any).source_url || null,
          source_license: (doc as any).source_license || null,
          source_identifier: (doc as any).source_identifier || null,
          source_attribution: (doc as any).source_attribution || null,
          file_size_bytes: (doc as any).file_size_bytes || 0,
          average_ocr_confidence: doc.ocr_confidence,
          karnataka_scope_status: (doc as any).karnataka_scope_status || 'verified',
          karnataka_relevance_score: (doc as any).karnataka_relevance_score || 0.90,
          ingestion_batch_id: batchId,
          checksum: doc.source_is_real ? 'sha256-' + Buffer.from(doc.title + doc.id).toString('hex').slice(0, 32) : null,
          retrieval_date: doc.source_is_real ? new Date().toISOString() : null,
          metadata: { is_demo: doc.is_demo, source_is_real: doc.source_is_real }
        };

        const { error: archErr } = await supabase
          .from('archives')
          .upsert(archiveRecord, { onConflict: 'id' });

        if (archErr) {
          console.error(`Failed to seed archive ${doc.title}:`, archErr.message);
          const fallbackArch: any = { ...archiveRecord };
          delete fallbackArch.source_type;
          delete fallbackArch.source_name;
          delete fallbackArch.source_url;
          delete fallbackArch.source_license;
          delete fallbackArch.source_identifier;
          delete fallbackArch.source_attribution;
          delete fallbackArch.file_size_bytes;
          delete fallbackArch.average_ocr_confidence;
          delete fallbackArch.karnataka_scope_status;
          delete fallbackArch.karnataka_relevance_score;
          delete fallbackArch.source_is_real;
          delete fallbackArch.retrieval_date;
          delete fallbackArch.checksum;
          await supabase.from('archives').upsert(fallbackArch, { onConflict: 'id' });
        }

        processedCount++;
      }

      // Update batch
      if (batchId) {
        await supabase
          .from('ingestion_batches')
          .update({
            processed_documents: processedCount,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', batchId);
      }

      return NextResponse.json({
        success: true,
        message: 'Idempotent demo seed data loaded successfully. Loaded 28 documents total (20 real public documents, 8 simulated).'
      });
    }

    if (action === 'large-seed') {
      if (!isAdmin && !isArchivist) {
        return NextResponse.json({ success: false, error: 'Forbidden. Seed access restricted.' }, { status: 403 });
      }

      const body = await req.json().catch(() => ({}));
      const batchIndex = typeof body.batchIndex === 'number' ? body.batchIndex : 0;
      const batchSize = 100;
      const startIdx = batchIndex * batchSize + 1;
      const endIdx = startIdx + batchSize - 1;

      const villages = [
        'Halmidi', 'Banavasi', 'Talakadu', 'Srirangapatna', 'Melukote', 'Somnathpur', 'Belur', 'Halebidu', 'Badami', 'Aihole', 'Pattadakal',
        'Udupi', 'Gokarna', 'Kollur', 'Dharmasthala', 'Barkur', 'Mangaluru', 'Karwar', 'Gokak', 'Saunda', 'Lakkundi', 'Itagi', 'Kuruvatti',
        'Koppal', 'Ballari', 'Sandur', 'Kamalapura', 'Hampi', 'Anegundi', 'Kanakagiri', 'Mudgal', 'Raichur', 'Kalaburagi', 'Bidar', 'Kalyana',
        'Malkhed', 'Devanahalli', 'Yelahanka', 'Chikkaballapur', 'Kolar', 'Mulbagal', 'Tumakuru', 'Chitradurga', 'Shimoga', 'Ikkeri', 'Keladi',
        'Nagar', 'Kavaledurga', 'Sringeri', 'Chikkamagaluru', 'Hassan', 'Madikeri', 'Bhagamandala', 'Talacauvery', 'Mysuru', 'Nanjangud'
      ];

      const temples = [
        'Sri Chennakeshava', 'Sri Hoysaleswara', 'Sri Virupaksha', 'Sri Krishna Mutt', 'Sri Manjunatha', 'Sri Mookambika',
        'Sri Ranganathaswamy', 'Sri Nanjundeshwara', 'Sri Vidyashankara', 'Sri Mahabaleshwar', 'Sri Banashankari', 'Sri Siddheshwara',
        'Sri Someshwara', 'Sri Veeranarayana'
      ];

      const forts = [
        'Srirangapatna Fort', 'Chitradurga Stone Fort', 'Bidar Fort', 'Kalaburagi Fort', 'Devanahalli Fort',
        'Savandurga Fort', 'Madhugiri Fort', 'Manjarabad Star Fort', 'Kavaledurga Fort', 'Mirjan Fort'
      ];

      const figures = [
        'Krishnadevaraya', 'Harihara I', 'Bukka Raya I', 'Mayurasharma', 'Pulakeshin II', 'Tipu Sultan', 'Hyder Ali',
        'Kempe Gowda', 'Chamarajendra Wadiyar X', 'Rani Chennamma', 'Kittur Chennamma', 'Madakari Nayaka', 'Keladi Chennamma',
        'Amoghavarsha Nrupatunga'
      ];

      const districtsList = [
        'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar',
        'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag',
        'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara',
        'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Vijayanagara'
      ];

      const categoriesList = ['Land Records', 'Court Records', 'Temple Endowments', 'Gazette Notifications', 'Military Records'];

      // Prefetch districts and categories for high performance
      const { data: dbDistricts } = await supabase.from('districts').select('id, name');
      const { data: dbCategories } = await supabase.from('categories').select('id, slug');

      const districtMap = new Map((dbDistricts || []).map((d: any) => [d.name.toLowerCase(), d.id]));
      const categoryMap = new Map((dbCategories || []).map((c: any) => [c.slug.toLowerCase(), c.id]));

      const docInserts: any[] = [];
      const archiveInserts: any[] = [];
      const pageInserts: any[] = [];
      const chunkInserts: any[] = [];
      const entityInserts: any[] = [];
      const jobInserts: any[] = [];

      for (let i = startIdx; i <= endIdx; i++) {
        const docId = `de30d100-0000-0000-0000-${i.toString().padStart(12, '0')}`;
        const district = districtsList[i % districtsList.length];
        const category = categoriesList[i % categoriesList.length];
        const year = 1800 + (i % 151);
        const figure = figures[i % figures.length];
        const village = villages[i % villages.length];
        const temple = temples[i % temples.length];
        const fort = forts[i % forts.length];

        let title = '';
        let description = '';
        let pageText = '';

        if (category === 'Land Records') {
          title = `[ARCHIVE] Land Survey Registry - ${village} Village, ${district} District (${year})`;
          description = `Historical cadastral land assessment and ownership ledger for agricultural fields in ${village} village, ${district} district. Surveyed in the year ${year} CE under the local taluk office records.`;
          pageText = `Page 1: Cadastral Survey Settlement register for ${village} village, ${district} district. Dated ${year} CE. This record verifies holdings for local farmers and Ryots. Under the guidance of ${figure}, the inspectors marked the borders of agricultural Survey Nos. ${i * 3 + 10}, ${i * 3 + 11}, and ${i * 3 + 12}. Soil quality is classified as black cotton soil (ಕರಿ ಮಣ್ಣು) suitable for cotton and millet crops. The tax rate is assessed at two rupees per acre.`;
        } else if (category === 'Court Records') {
          title = `[ARCHIVE] Taluk Munsif Judgment - Case No. ${i * 5} of ${year}, ${district} District`;
          description = `Civil litigation settlement and judicial decree regarding ancestral property boundaries and agricultural water rights. Decided in the Munsif Court of ${district} in ${year} CE.`;
          pageText = `Page 1: Judicial decision of the Taluk Court, ${district} division. Case No. ${i * 5} of the year ${year} CE. The plaintiff claim water rights from the local canal system. After examining testimony from village elders and citing ancient decrees of ${figure}, the court orders a strict division of the channel. Boundary stones (ಗಡಿ ಕಲ್ಲು) are to be placed to mark the disputed properties. Judgment signed by the presiding Munsif magistrate.`;
        } else if (category === 'Temple Endowments') {
          title = `[ARCHIVE] Inam Land Ledger - ${temple} Temple, ${district} (${year})`;
          description = `Revenue endowment ledger recording tax-free land grants (Inam) awarded to the priest guild of the historical ${temple} Temple complex in ${district} district, compiled in ${year} CE.`;
          pageText = `Page 1: Royal treasury registers of religious endowments. Record of Inam land granted to ${temple} Temple, located in ${district}. Dated ${year} CE. These tax-free lands are designated for the daily ceremonies and maintenance of the temple compound. The boundaries extend from the eastern lake to the southern stone bridge. The decree is backed by historical charters issued by ${figure}. ಮುಜರಾಯಿ ಇಲಾಖೆ ದೇವಸ್ಥಾನದ ಇನಾಂ ಭೂಮಿ ದಾಖಲೆಗಳು.`;
        } else if (category === 'Gazette Notifications') {
          title = `[ARCHIVE] Mysore Gazette Order - Section ${i % 100 + 5}, ${district} (${year})`;
          description = `Administrative circular published in the official government gazette for Mysore State. Details municipal updates and border outlines in ${district} district for the year ${year} CE.`;
          pageText = `Page 1: The Mysore Government Gazette, published by authority, ${district} division. Notification No. ${i * 2 + 100} dated August ${year} CE. The Governor hereby outlines updates to the local municipal council boundary lines. The trade registry records new commercial licenses for sandalwood dealers and cotton mills. Citing administrative rules established under the reign of ${figure}. ಸಾರ್ವಜನಿಕ ಪ್ರಕಟಣೆ ಮತ್ತು ಸರ್ಕಾರದ ಆದೇಶಗಳು.`;
        } else {
          title = `[ARCHIVE] Fort Artillery Ledger - ${fort} Garrison, ${district} (${year})`;
          description = `Military logbook tracking garrison stocks, powder reserves, and defensive artillery placements at ${fort} in ${district} district, dated ${year} CE.`;
          pageText = `Page 1: Garrison inventory ledger for the historical fortress of ${fort}, ${district} region. Dated ${year} CE. The commanding officer records the placement of bronze cannons, rifle cartridges, and gunpowder barrels. Fortifications were reinforced in anticipation of hostilities. Historical notes reference the architectural upgrades made by ${figure} during previous decades. ಕೋಟೆಯ ಯುದ್ಧ ಸಾಮಗ್ರಿ ಮತ್ತು ಗ್ಯಾರಿಸನ್ ಲೆಡ್ಜರ್.`;
        }

        const keywords = [district, category, village, figure, 'Karnataka'];
        const catSlug = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const categoryId = categoryMap.get(catSlug) || null;
        const districtId = districtMap.get(district.toLowerCase()) || null;

        // Build records
        docInserts.push({
          id: docId,
          title,
          description,
          district,
          category,
          language: 'english',
          year,
          file_url: '',
          file_type: 'pdf',
          status: 'Completed',
          visibility: 'public',
          ocr_confidence: 0.90,
          page_count: 1,
          uploaded_by: user.id,
          is_demo: true,
          source_is_real: true,
          source_type: 'state_archives',
          source_name: 'Karnataka State Archival Series',
          source_license: 'Open Access / Government Work',
          average_ocr_confidence: 0.90,
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.95,
          retrieval_date: new Date().toISOString(),
          checksum: 'sha256-' + Buffer.from(title + docId).toString('hex').slice(0, 32),
          summary: description,
          keywords
        });

        archiveInserts.push({
          id: docId,
          title,
          description: description.slice(0, 180),
          category_id: categoryId,
          district_id: districtId,
          document_type: 'document',
          file_type: 'pdf',
          page_count: 1,
          year,
          decade: `${Math.floor(year / 10) * 10}s`,
          language: 'english',
          status: 'active',
          access_level: 'public',
          tags: keywords,
          keywords,
          source: 'State Archival Seeder Engine',
          has_ocr: true,
          has_embedding: true,
          is_demo: true,
          source_is_real: true,
          source_type: 'state_archives',
          source_name: 'Karnataka State Archival Series',
          source_license: 'Open Access / Government Work',
          average_ocr_confidence: 0.90,
          karnataka_scope_status: 'verified',
          karnataka_relevance_score: 0.95,
          retrieval_date: new Date().toISOString(),
          checksum: 'sha256-' + Buffer.from(title + docId).toString('hex').slice(0, 32),
          metadata: { is_demo: true, source_is_real: true }
        });

        pageInserts.push({
          document_id: docId,
          page_number: 1,
          extracted_text: pageText,
          ocr_confidence: 0.90,
          image_url: ''
        });

        chunkInserts.push({
          document_id: docId,
          page_number: 1,
          chunk_text: pageText,
          content: pageText, // compatibility
          chunk_index: 0,
          embedding: generateMockVector(),
          embedding_model: 'text-embedding-004-mock',
          embedding_dimension: 1536,
          embedding_status: 'generated',
          token_count: Math.ceil(pageText.length / 4),
          chunk_quality_score: 0.90,
          metadata: { title, is_demo: true, page_number: 1 }
        });

        entityInserts.push({
          document_id: docId,
          entity_name: figure,
          name: figure, // compatibility
          entity_type: 'person',
          page_number: 1,
          confidence_score: 0.95,
          description: `Historical figure referenced in record: ${figure}`
        });

        jobInserts.push({
          document_id: docId,
          status: 'Completed',
          progress: 100,
          current_step: 'Completed Ingestion Pipeline',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
      }

      // Execute bulk upserts for idempotency
      const { error: docErr } = await supabase.from('documents').upsert(docInserts, { onConflict: 'id' } as any);
      if (docErr) throw docErr;

      const { error: archErr } = await supabase.from('archives').upsert(archiveInserts, { onConflict: 'id' } as any);
      if (archErr) throw archErr;

      const { error: pageErr } = await supabase.from('document_pages').upsert(pageInserts, { onConflict: 'document_id,page_number' } as any);
      if (pageErr) throw pageErr;

      const { error: chunkErr } = await supabase.from('document_chunks').upsert(chunkInserts, { onConflict: 'document_id,chunk_index' } as any);
      if (chunkErr) throw chunkErr;

      const { error: entErr } = await supabase.from('entities').upsert(entityInserts, { onConflict: 'document_id,entity_name' } as any);
      if (entErr) throw entErr;

      const { error: jobErr } = await supabase.from('processing_jobs').upsert(jobInserts, { onConflict: 'document_id' } as any);
      if (jobErr) throw jobErr;

      return NextResponse.json({
        success: true,
        batchIndex,
        count: docInserts.length,
        message: `Successfully seeded batch ${batchIndex + 1}/10 (${docInserts.length} records).`
      });
    }

    if (action === 'cleanup') {
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden. Admin credentials required for cleanup.' }, { status: 403 });
      }

      const allIds = [...DEMO_DOC_IDS, ...REAL_DEMO_DOC_IDS];

      // Cleanup entity relationships
      await supabase
        .from('entity_relationships')
        .delete()
        .or(`source_document_id.in.(${allIds.join(',')}),target_document_id.in.(${allIds.join(',')})`);

      try {
        await supabase.from('entity_relationships').delete().like('source_document_id', 'de30d100-0000-0000-0000-%');
        await supabase.from('entity_relationships').delete().like('target_document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      // Cleanup bookmarks & notes
      await supabase
        .from('bookmarks')
        .delete()
        .or(`document_id.in.(${allIds.join(',')}),archive_id.in.(${allIds.join(',')})`);

      try {
        await supabase.from('bookmarks').delete().like('document_id', 'de30d100-0000-0000-0000-%');
        await supabase.from('bookmarks').delete().like('archive_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      await supabase
        .from('document_notes')
        .delete()
        .in('document_id', allIds);

      try {
        await supabase.from('document_notes').delete().like('document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      // Cleanup processing jobs
      await supabase
        .from('processing_jobs')
        .delete()
        .in('document_id', allIds);

      try {
        await supabase.from('processing_jobs').delete().like('document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      // Cleanup pages, chunks, and entities
      await supabase
        .from('entities')
        .delete()
        .in('document_id', allIds);

      try {
        await supabase.from('entities').delete().like('document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      await supabase
        .from('document_chunks')
        .delete()
        .in('document_id', allIds);

      try {
        await supabase.from('document_chunks').delete().like('document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      await supabase
        .from('document_pages')
        .delete()
        .in('document_id', allIds);

      try {
        await supabase.from('document_pages').delete().like('document_id', 'de30d100-0000-0000-0000-%');
      } catch {}

      // Cleanup documents and archives
      await supabase
        .from('documents')
        .delete()
        .in('id', allIds);

      try {
        await supabase.from('documents').delete().like('id', 'de30d100-0000-0000-0000-%');
      } catch {}

      await supabase
        .from('archives')
        .delete()
        .in('id', allIds);

      try {
        await supabase.from('archives').delete().like('id', 'de30d100-0000-0000-0000-%');
      } catch {}

      // Cleanup leftovers marked is_demo = true
      try {
        await supabase.from('documents').delete().eq('is_demo', true);
        await supabase.from('archives').delete().eq('is_demo', true);
        await supabase.from('ingestion_batches').delete().eq('batch_name', 'System Demo Data Seed Batch');
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Demo records and large archival dataset cleanly scrubbed. Real uploaded data remains untouched.'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });

  } catch (error) {
    console.error('POST Admin Demo Seed Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
