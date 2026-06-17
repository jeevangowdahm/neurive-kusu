// Mock data generators for demo purposes
// These simulate the 1M+ records in the Karnataka Digital Archive

export const KARNATAKA_DISTRICTS = [
  { id: 'dist-1', name: 'Bengaluru Urban', name_kannada: 'ಬೆಂಗಳೂರು ನಗರ', division: 'Bengaluru', headquarter: 'Bengaluru', taluk_count: 4, area_sqkm: 2196, population: 9621551 },
  { id: 'dist-2', name: 'Mysuru', name_kannada: 'ಮೈಸೂರು', division: 'Mysuru', headquarter: 'Mysuru', taluk_count: 7, area_sqkm: 6854, population: 3001127 },
  { id: 'dist-3', name: 'Belagavi', name_kannada: 'ಬೆಳಗಾವಿ', division: 'Kittur Karnataka', headquarter: 'Belagavi', taluk_count: 10, area_sqkm: 13415, population: 4779661 },
  { id: 'dist-4', name: 'Dakshina Kannada', name_kannada: 'ದಕ್ಷಿಣ ಕನ್ನಡ', division: 'Coastal Karnataka', headquarter: 'Mangaluru', taluk_count: 5, area_sqkm: 4843, population: 2089649 },
  { id: 'dist-5', name: 'Ballari', name_kannada: 'ಬಳ್ಳಾರಿ', division: 'Kalyana Karnataka', headquarter: 'Ballari', taluk_count: 7, area_sqkm: 8447, population: 2532383 },
  { id: 'dist-6', name: 'Kalaburagi', name_kannada: 'ಕಲಬುರಗಿ', division: 'Kalyana Karnataka', headquarter: 'Kalaburagi', taluk_count: 10, area_sqkm: 16224, population: 2566326 },
  { id: 'dist-7', name: 'Tumakuru', name_kannada: 'ತುಮಕೂರು', division: 'Bengaluru', headquarter: 'Tumakuru', taluk_count: 10, area_sqkm: 10597, population: 2681449 },
  { id: 'dist-8', name: 'Shivamogga', name_kannada: 'ಶಿವಮೊಗ್ಗ', division: 'Mysuru', headquarter: 'Shivamogga', taluk_count: 7, area_sqkm: 8477, population: 1755512 },
  { id: 'dist-9', name: 'Vijayapura', name_kannada: 'ವಿಜಯಪುರ', division: 'Kalyana Karnataka', headquarter: 'Vijayapura', taluk_count: 5, area_sqkm: 10541, population: 2176075 },
  { id: 'dist-10', name: 'Hassan', name_kannada: 'ಹಾಸನ', division: 'Mysuru', headquarter: 'Hassan', taluk_count: 8, area_sqkm: 6814, population: 1776421 },
  { id: 'dist-11', name: 'Dharwad', name_kannada: 'ಧಾರವಾಡ', division: 'Kittur Karnataka', headquarter: 'Dharwad', taluk_count: 5, area_sqkm: 4263, population: 1847023 },
  { id: 'dist-12', name: 'Raichur', name_kannada: 'ರಾಯಚೂರು', division: 'Kalyana Karnataka', headquarter: 'Raichur', taluk_count: 5, area_sqkm: 6827, population: 1924773 },
];

export const ARCHIVE_CATEGORIES = [
  { id: 'cat-1', name: 'Land Records', name_kannada: 'ಭೂ ದಾಖಲೆಗಳು', slug: 'land-records', icon: 'map', color: '#0ea5e9', record_count: 2500000, description: 'Survey numbers, property deeds, mutation records' },
  { id: 'cat-2', name: 'Court Records', name_kannada: 'ನ್ಯಾಯಾಲಯ ದಾಖಲೆಗಳು', slug: 'court-records', icon: 'scale', color: '#dc2626', record_count: 1600000, description: 'Civil and criminal court judgments and orders' },
  { id: 'cat-3', name: 'Temple Records', name_kannada: 'ದೇವಾಲಯ ದಾಖಲೆಗಳು', slug: 'temple-records', icon: 'star', color: '#d97706', record_count: 800000, description: 'Temple histories, endowments, and rituals' },
  { id: 'cat-4', name: 'Gazette Notifications', name_kannada: 'ಸರ್ಕಾರಿ ಗೆಜೆಟ್', slug: 'gazette-notifications', icon: 'file-text', color: '#7c3aed', record_count: 1300000, description: 'Government orders, notifications, and gazettes' },
  { id: 'cat-5', name: 'Manuscripts', name_kannada: 'ಹಸ್ತಪ್ರತಿಗಳು', slug: 'manuscripts', icon: 'book-open', color: '#059669', record_count: 450000, description: 'Ancient Kannada and Sanskrit manuscripts' },
  { id: 'cat-6', name: 'Census Records', name_kannada: 'ಜನಗಣತಿ ದಾಖಲೆಗಳು', slug: 'census-records', icon: 'users', color: '#2563eb', record_count: 600000, description: 'Population census and demographic data' },
  { id: 'cat-7', name: 'Maps & Surveys', name_kannada: 'ನಕ್ಷೆಗಳು ಮತ್ತು ಸರ್ವೆ', slug: 'maps-surveys', icon: 'map-pin', color: '#db2777', record_count: 450000, description: 'Topographic maps and survey reports' },
  { id: 'cat-8', name: 'Kannada Literature', name_kannada: 'ಕನ್ನಡ ಸಾಹಿತ್ಯ', slug: 'kannada-literature', icon: 'book', color: '#0891b2', record_count: 750000, description: 'Classical and modern Kannada literary works' },
  { id: 'cat-9', name: 'Revenue Records', name_kannada: 'ಕಂದಾಯ ದಾಖಲೆಗಳು', slug: 'revenue-records', icon: 'calculator', color: '#65a30d', record_count: 900000, description: 'Tax records, revenue registers, and accounts' },
  { id: 'cat-10', name: 'Archaeological Records', name_kannada: 'ಪುರಾತತ್ತ್ವ ದಾಖಲೆಗಳು', slug: 'archaeological-records', icon: 'compass', color: '#9333ea', record_count: 250000, description: 'Excavation reports and site surveys' },
  { id: 'cat-11', name: 'Freedom Movement', name_kannada: 'ಸ್ವಾತಂತ್ರ್ಯ ಚಳವಳಿ', slug: 'freedom-movement', icon: 'flag', color: '#ea580c', record_count: 100000, description: 'Karnataka freedom struggle documents' },
  { id: 'cat-12', name: 'Administrative Records', name_kannada: 'ಆಡಳಿತ ದಾಖಲೆಗಳು', slug: 'administrative-records', icon: 'briefcase', color: '#64748b', record_count: 300000, description: 'Government administration and governance records' },
];

const DOC_TITLES = [
  'Survey Settlement Record', 'Land Revenue Register', 'Property Sale Deed', 'Court Judgment',
  'Temple Endowment Grant', 'Gazette Notification', 'Census Enumeration Sheet', 'Topographic Survey Map',
  'Kannada Manuscript', 'Village Account Book', 'Mutation Register', 'Khata Certificate',
  'RTC Record', 'Writ Petition Order', 'Appeal Judgment', 'Revenue Petition',
  'Forest Settlement Record', 'Municipal Tax Register', 'Boundary Demarcation Report',
  'Patta Passbook', 'Encumbrance Certificate', 'Sale Agreement', 'Gift Deed',
  'Partition Deed', 'Copper Plate Inscription', 'Freedom Fighter Record', 'Archaeological Survey',
  'Heritage Site Documentation', 'Temple Consecration Record', 'Village Settlement Register',
];

const TALUKS = [
  'Bengaluru North', 'Bengaluru South', 'Mysuru', 'Mangaluru', 'Hubballi',
  'Dharwad', 'Shivamogga', 'Hassan', 'Mandya', 'Tumakuru', 'Davanagere',
  'Belagavi', 'Kalaburagi', 'Ballari', 'Raichur', 'Vijayapura', 'Bagalkot',
  'Gadag', 'Haveri', 'Koppal', 'Yadgir', 'Bidar', 'Chitradurga', 'Ramanagara',
  'Kolar', 'Chikkaballapur', 'Udupi', 'Karwar', 'Madikeri', 'Chikkamagaluru',
  'Hoskote', 'Nelamangala', 'Devanahalli', 'Channapatna', 'Magadi',
];

const YEARS = [1820, 1835, 1842, 1858, 1867, 1879, 1891, 1901, 1911, 1921, 1931, 1941, 1947, 1951, 1956, 1961, 1971, 1981, 1991, 2001, 2011, 2015, 2018, 2021];

const AUTHORS = [
  'District Collector', 'Revenue Inspector', 'Survey Commissioner', 'High Court Registry',
  'Temple Executive Officer', 'Census Superintendent', 'Forest Settlement Officer',
  'Municipal Commissioner', 'Tahsildar', 'Village Accountant (Shanbhog)',
  'Settlement Commissioner', 'Land Records Officer',
];

const DESCRIPTIONS = [
  'This document contains detailed survey and settlement records for the specified region of Karnataka. It includes boundary descriptions, land classifications, and ownership details as recorded by the British administration.',
  'Official revenue records maintained by the Karnataka Revenue Department. Contains land revenue assessments, tax collection records, and ownership transfer details for the specified taluk.',
  'Historical court document from the Karnataka judicial archives. Contains legal proceedings, evidence, arguments, and final judgment in the matter. Part of the Karnataka Judicial Heritage Collection.',
  'Ancient Kannada manuscript preserved in the Karnataka State Archives. Written in old Kannada script, this document provides insights into the cultural and social life of medieval Karnataka.',
  'Government gazette notification issued by the Government of Karnataka. Contains official orders, appointments, land acquisitions, and policy notifications.',
  'Temple record documenting the religious and administrative history of this sacred site. Includes details of endowments, rituals, festivals, and temple administration.',
  'Census enumeration records compiled during the national census. Contains demographic data, household information, and population statistics for the specified region.',
  'Survey and mapping records created by the Survey of India and Karnataka Survey Department. Includes topographic details, geographical features, and boundary markings.',
];

let mockIdCounter = 1;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMockArchive(index: number): MockArchive {
  const r = (n: number) => seededRandom(index * 137 + n);
  const districtIdx = Math.floor(r(1) * KARNATAKA_DISTRICTS.length);
  const categoryIdx = Math.floor(r(2) * ARCHIVE_CATEGORIES.length);
  const yearIdx = Math.floor(r(3) * YEARS.length);
  const talukIdx = Math.floor(r(4) * TALUKS.length);
  const titleIdx = Math.floor(r(5) * DOC_TITLES.length);
  const authorIdx = Math.floor(r(6) * AUTHORS.length);
  const descIdx = Math.floor(r(7) * DESCRIPTIONS.length);
  const year = YEARS[yearIdx];
  const district = KARNATAKA_DISTRICTS[districtIdx];
  const category = ARCHIVE_CATEGORIES[categoryIdx];

  return {
    id: `arch-${index + 1}`,
    accession_number: `KAR-${String(index + 1).padStart(8, '0')}`,
    title: `${DOC_TITLES[titleIdx]} - ${TALUKS[talukIdx]} ${year}`,
    title_kannada: `ದಾಖಲೆ - ${TALUKS[talukIdx]} ${year}`,
    description: DESCRIPTIONS[descIdx],
    year,
    decade: `${Math.floor(year / 10) * 10}s`,
    date_recorded: `${year}-${String(Math.floor(r(8) * 12) + 1).padStart(2, '0')}-${String(Math.floor(r(9) * 28) + 1).padStart(2, '0')}`,
    language: r(10) > 0.4 ? 'kannada' : r(10) > 0.2 ? 'english' : 'both',
    document_type: ['land_deed', 'court_order', 'manuscript', 'gazette', 'survey_map', 'census_form', 'revenue_register', 'temple_record'][Math.floor(r(11) * 8)],
    file_type: r(12) > 0.3 ? 'pdf' : 'image',
    page_count: Math.floor(r(13) * 8) + 3,
    author: AUTHORS[authorIdx],
    source: 'Karnataka State Archives',
    taluk: TALUKS[talukIdx],
    view_count: Math.floor(r(14) * 5000),
    download_count: Math.floor(r(15) * 1000),
    relevance_score: 0.3 + r(16) * 0.7,
    is_featured: r(17) > 0.95,
    has_ocr: r(18) > 0.3,
    has_embedding: r(19) > 0.5,
    access_level: r(20) > 0.1 ? 'public' : 'restricted',
    status: 'active',
    tags: ['karnataka', category.slug, year.toString()],
    district: district,
    category: category,
    metadata: {
      digitization_quality: r(21) > 0.6 ? 'high' : r(21) > 0.3 ? 'medium' : 'low',
      preservation_status: r(22) > 0.5 ? 'good' : r(22) > 0.3 ? 'fair' : 'poor',
      physical_location: 'Karnataka State Archives, Bengaluru',
    },
    created_at: new Date(Date.now() - Math.floor(r(23) * 1000 * 60 * 60 * 24 * 365 * 5)).toISOString(),
  };
}

export interface MockArchive {
  id: string;
  accession_number: string;
  title: string;
  title_kannada?: string;
  description?: string;
  year: number;
  decade: string;
  date_recorded: string;
  language: string;
  document_type: string;
  file_type: string;
  file_url?: string;
  thumbnail_url?: string;
  page_count: number;
  author: string;
  source: string;
  taluk: string;
  view_count: number;
  download_count: number;
  relevance_score: number;
  is_featured: boolean;
  has_ocr: boolean;
  has_embedding: boolean;
  access_level: string;
  status: string;
  tags: string[];
  district: typeof KARNATAKA_DISTRICTS[0];
  category: typeof ARCHIVE_CATEGORIES[0];
  metadata: Record<string, unknown>;
  created_at: string;
  source_type?: string;
  source_name?: string;
  source_license?: string;
  source_attribution?: string;
  retrieval_date?: string;
  source_is_real?: boolean;
  is_demo?: boolean;
}

export const TOTAL_RECORDS = 10_000_000;

export function getMockArchives(page = 1, limit = 20, filters?: {
  category?: string;
  district?: string;
  year?: number;
  language?: string;
  search?: string;
}): { archives: MockArchive[]; total: number } {
  const offset = (page - 1) * limit;
  const archives: MockArchive[] = [];
 
  let total = TOTAL_RECORDS;
  let indices: number[] = [];
 
  // Generate indices for this page
  for (let i = offset; i < offset + limit && i < total; i++) {
    indices.push(i);
  }
 
  for (const idx of indices) {
    archives.push(generateMockArchive(idx));
  }
 
  return { archives, total };
}

export const ANALYTICS_DATA = {
  totalRecords: 10_000_000,
  totalDistricts: 30,
  totalCategories: 12,
  totalUsers: 8432,
  totalSearches: 234567,
  averageSearchTime: 142,
  topSearchTerms: [
    { term: 'land records', count: 45234 },
    { term: 'survey number', count: 38921 },
    { term: 'court judgment', count: 29847 },
    { term: 'temple records', count: 24103 },
    { term: 'revenue register', count: 19876 },
    { term: 'census 1901', count: 17234 },
    { term: 'mysuru palace', count: 14987 },
    { term: 'vijayanagara', count: 12453 },
  ],
  monthlyUploads: [
    { month: 'Jan', count: 1234 },
    { month: 'Feb', count: 1456 },
    { month: 'Mar', count: 1789 },
    { month: 'Apr', count: 2134 },
    { month: 'May', count: 1987 },
    { month: 'Jun', count: 2456 },
    { month: 'Jul', count: 2789 },
    { month: 'Aug', count: 3124 },
    { month: 'Sep', count: 2876 },
    { month: 'Oct', count: 3456 },
    { month: 'Nov', count: 3789 },
    { month: 'Dec', count: 4123 },
  ],
  recordsByCategory: ARCHIVE_CATEGORIES.map(c => ({ name: c.name, count: c.record_count })),
  recordsByDecade: [
    { decade: '1820s', count: 12450 },
    { decade: '1840s', count: 18930 },
    { decade: '1860s', count: 24780 },
    { decade: '1880s', count: 38920 },
    { decade: '1900s', count: 67430 },
    { decade: '1920s', count: 89230 },
    { decade: '1940s', count: 115670 },
    { decade: '1960s', count: 134520 },
    { decade: '1980s', count: 167890 },
    { decade: '2000s', count: 198340 },
    { decade: '2010s', count: 132770 },
  ],
};
