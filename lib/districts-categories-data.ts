// Shared Data Constants for Karnataka Districts and Categories

export interface DistrictInfo {
  id: string;
  name: string;
  name_kannada: string;
  division: string;
  headquarter: string;
  taluk_count: number;
  area_sqkm: number;
  population: number;
  description: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  name_kannada: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  keywords: string[];
}

export const KARNATAKA_DISTRICTS_ALL: DistrictInfo[] = [
  { id: 'dist-1', name: 'Bagalkot', name_kannada: 'ಬಾಗಲಕೋಟೆ', division: 'Belagavi', headquarter: 'Bagalkot', taluk_count: 6, area_sqkm: 6595, population: 1889752, description: 'Famous for its historical chalukyan cave temples in Badami, Aihole and Pattadakal.' },
  { id: 'dist-2', name: 'Ballari', name_kannada: 'ಬಳ್ಳಾರಿ', division: 'Kalaburagi', headquarter: 'Ballari', taluk_count: 7, area_sqkm: 8447, population: 2532383, description: 'Rich in mineral deposits and home to historical sites adjacent to Hampi.' },
  { id: 'dist-3', name: 'Belagavi', name_kannada: 'ಬೆಳಗಾವಿ', division: 'Belagavi', headquarter: 'Belagavi', taluk_count: 10, area_sqkm: 13415, population: 4779661, description: 'A border district known for its bamboo groves and Kittoor Rani Chennamma history.' },
  { id: 'dist-4', name: 'Bengaluru Rural', name_kannada: 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', division: 'Bengaluru', headquarter: 'Bengaluru', taluk_count: 4, area_sqkm: 2259, population: 990923, description: 'Surrounding the metropolitan hub, known for agriculture and Nandi Hills.' },
  { id: 'dist-5', name: 'Bengaluru Urban', name_kannada: 'ಬೆಂಗಳೂರು ನಗರ', division: 'Bengaluru', headquarter: 'Bengaluru', taluk_count: 4, area_sqkm: 2196, population: 9621551, description: 'The administrative, tech, and cultural capital of Karnataka.' },
  { id: 'dist-6', name: 'Bidar', name_kannada: 'ಬೀದರ್', division: 'Kalaburagi', headquarter: 'Bidar', taluk_count: 5, area_sqkm: 5448, population: 1726079, description: 'Northmost crown of Karnataka, renowned for Bidriware crafts and Bidar Fort.' },
  { id: 'dist-7', name: 'Chamarajanagar', name_kannada: 'ಚಾಮರಾಜನಗರ', division: 'Mysuru', headquarter: 'Chamarajanagar', taluk_count: 4, area_sqkm: 5101, population: 1020791, description: 'Southernmost corner containing dense forests, Biligirirangana Hills, and tigers.' },
  { id: 'dist-8', name: 'Chikkaballapur', name_kannada: 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', division: 'Bengaluru', headquarter: 'Chikkaballapur', taluk_count: 6, area_sqkm: 4219, population: 1254494, description: 'Famous birth region of Sir M. Visvesvaraya and close to Nandi Hills.' },
  { id: 'dist-9', name: 'Chikkamagaluru', name_kannada: 'ಚಿಕ್ಕಮಗಳೂರು', division: 'Mysuru', headquarter: 'Chikkamagaluru', taluk_count: 7, area_sqkm: 7201, population: 1137574, description: 'The land of coffee, hills, and Mullayanagiri, the highest peak in Karnataka.' },
  { id: 'dist-10', name: 'Chitradurga', name_kannada: 'ಚಿತ್ರದುರ್ಗ', division: 'Bengaluru', headquarter: 'Chitradurga', taluk_count: 6, area_sqkm: 8440, population: 1659456, description: 'Renowned for the Chitradurga stone fort (Kallina Kote) and heroic Obavva.' },
  { id: 'dist-11', name: 'Dakshina Kannada', name_kannada: 'ದಕ್ಷಿಣ ಕನ್ನಡ', division: 'Coastal', headquarter: 'Mangaluru', taluk_count: 5, area_sqkm: 4843, population: 2089649, description: 'Coastal hub famous for Yakshagana, beaches, and educational institutes.' },
  { id: 'dist-12', name: 'Davanagere', name_kannada: 'ದಾವಣಗೆರೆ', division: 'Bengaluru', headquarter: 'Davanagere', taluk_count: 6, area_sqkm: 5924, population: 1946905, description: 'The heart of Karnataka, famous for butter dosa (Benne Dosa) and textile mills.' },
  { id: 'dist-13', name: 'Dharwad', name_kannada: 'ಧಾರವಾಡ', division: 'Belagavi', headquarter: 'Dharwad', taluk_count: 5, area_sqkm: 4263, population: 1847023, description: 'A cultural and literary hub, famous for Dharwad pedha sweet and Hindustani music.' },
  { id: 'dist-14', name: 'Gadag', name_kannada: 'ಗದಗ', division: 'Belagavi', headquarter: 'Gadag', taluk_count: 5, area_sqkm: 4656, population: 1065235, description: 'Home to the famous Veera Narayana Temple and printed textile printing.' },
  { id: 'dist-15', name: 'Hassan', name_kannada: 'ಹಾಸನ', division: 'Mysuru', headquarter: 'Hassan', taluk_count: 8, area_sqkm: 6814, population: 1776421, description: 'Core seat of Hoysala architecture with magnificent temples at Belur and Halebidu.' },
  { id: 'dist-16', name: 'Haveri', name_kannada: 'ಹಾವೇರಿ', division: 'Belagavi', headquarter: 'Haveri', taluk_count: 7, area_sqkm: 4823, population: 1597668, description: 'Famous for cardamom garlands and the great poet Kanakadasa.' },
  { id: 'dist-17', name: 'Kalaburagi', name_kannada: 'ಕಲಬುರಗಿ', division: 'Kalaburagi', headquarter: 'Kalaburagi', taluk_count: 10, area_sqkm: 16224, population: 2566326, description: 'Home of Gulbarga Fort, Bahmani monuments, and Sufi saint Hazrat Khwaja Bande Nawaz.' },
  { id: 'dist-18', name: 'Kodagu', name_kannada: 'ಕೊಡಗು', division: 'Mysuru', headquarter: 'Madikeri', taluk_count: 3, area_sqkm: 4102, population: 554762, description: 'Coorg coffee valleys, source of Kaveri river, and home of Kodava culture.' },
  { id: 'dist-19', name: 'Kolar', name_kannada: 'ಕೋಲಾರ', division: 'Bengaluru', headquarter: 'Kolar', taluk_count: 5, area_sqkm: 3969, population: 1540128, description: 'Known for its historical gold fields (KGF) and milk production.' },
  { id: 'dist-20', name: 'Koppal', name_kannada: 'ಕೊಪ್ಪಳ', division: 'Kalaburagi', headquarter: 'Koppal', taluk_count: 4, area_sqkm: 7189, population: 1391000, description: 'Home of the magnificent Koppal Fort and historical toy making.' },
  { id: 'dist-21', name: 'Mandya', name_kannada: 'ಮಂಡ್ಯ', division: 'Mysuru', headquarter: 'Mandya', taluk_count: 7, area_sqkm: 4176, population: 1808680, description: 'Sugarcane heartland, home to KRS Dam, and ancient Melukote temple.' },
  { id: 'dist-22', name: 'Mysuru', name_kannada: 'ಮೈಸೂರು', division: 'Mysuru', headquarter: 'Mysuru', taluk_count: 7, area_sqkm: 6854, population: 3001127, description: 'The cultural capital, famous for Mysore Palace, Dasara, and sandalwood.' },
  { id: 'dist-23', name: 'Raichur', name_kannada: 'ರಾಯಚೂರು', division: 'Kalaburagi', headquarter: 'Raichur', taluk_count: 5, area_sqkm: 6827, population: 1924773, description: 'Nestled between Krishna and Tungabhadra rivers, famous for Raichur Fort.' },
  { id: 'dist-24', name: 'Ramanagara', name_kannada: 'ರಾಮನಗರ', division: 'Bengaluru', headquarter: 'Ramanagara', taluk_count: 4, area_sqkm: 3302, population: 1082636, description: 'The silk town, famous for rugged granite hills where Sholay was filmed.' },
  { id: 'dist-25', name: 'Shivamogga', name_kannada: 'ಶಿವಮೊಗ್ಗ', division: 'Mysuru', headquarter: 'Shivamogga', taluk_count: 7, area_sqkm: 8477, population: 1755512, description: 'Gateway to Western Ghats, home to Jog Falls, the highest waterfall.' },
  { id: 'dist-26', name: 'Tumakuru', name_kannada: 'ತುಮಕೂರು', division: 'Bengaluru', headquarter: 'Tumakuru', taluk_count: 10, area_sqkm: 10597, population: 2681449, description: 'Coconut city and home of Siddaganga Mutt and historical hill forts.' },
  { id: 'dist-27', name: 'Udupi', name_kannada: 'ಉಡುಪಿ', division: 'Coastal', headquarter: 'Udupi', taluk_count: 3, area_sqkm: 3598, population: 1177361, description: 'Famous for Sri Krishna Temple, Udupi cuisine, and pristine beaches.' },
  { id: 'dist-28', name: 'Uttara Kannada', name_kannada: 'ಉತ್ತರ ಕನ್ನಡ', division: 'Coastal', headquarter: 'Karwar', taluk_count: 11, area_sqkm: 10291, population: 1437169, description: 'Forested coastal region, home to Karwar beaches and Yana rock formations.' },
  { id: 'dist-29', name: 'Vijayapura', name_kannada: 'ವಿಜಯಪುರ', division: 'Kalaburagi', headquarter: 'Vijayapura', taluk_count: 5, area_sqkm: 10541, population: 2176075, description: 'Famous seat of Adil Shahi dynasty and Gol Gumbaz, the whispering gallery.' },
  { id: 'dist-30', name: 'Yadgir', name_kannada: 'ಯಾದಗಿರಿ', division: 'Kalaburagi', headquarter: 'Yadgir', taluk_count: 3, area_sqkm: 5106, population: 1172985, description: 'Carved out of Kalaburagi, known for Yadgiri hill fort and agriculture.' },
  { id: 'dist-31', name: 'Vijayanagara', name_kannada: 'ವಿಜಯನಗರ', division: 'Kalaburagi', headquarter: 'Hosapete', taluk_count: 6, area_sqkm: 5644, population: 1341000, description: 'Created in 2021, home to the Hampi World Heritage Site of the Vijayanagara Empire.' }
];

export const ARCHIVE_CATEGORIES_ALL: CategoryInfo[] = [
  {
    id: 'cat-1',
    name: 'Land Records',
    name_kannada: 'ಭೂ ದಾಖಲೆಗಳು',
    slug: 'land-records',
    icon: 'map',
    color: '#0ea5e9',
    description: 'Survey numbers, property deeds, mutation registers, and tenancy records.',
    keywords: ['survey number', 'mutation', 'property deed', 'khata', 'rtc', 'tenancy']
  },
  {
    id: 'cat-2',
    name: 'Administrative Records',
    name_kannada: 'ಆಡಳಿತ ದಾಖಲೆಗಳು',
    slug: 'administrative-records',
    icon: 'briefcase',
    color: '#64748b',
    description: 'Royal decrees, colonial governance logs, and municipal registers.',
    keywords: ['royal decree', 'governance log', 'municipal register', 'dispatch', 'correspondence']
  },
  {
    id: 'cat-3',
    name: 'Historical Letters',
    name_kannada: 'ಐತಿಹಾಸಿಕ ಪತ್ರಗಳು',
    slug: 'historical-letters',
    icon: 'mail',
    color: '#e11d48',
    description: 'Correspondence of historical figures, royal letters, and diplomatic notes.',
    keywords: ['correspondence', 'diplomatic note', 'treaty', 'personal letter', 'missive']
  },
  {
    id: 'cat-4',
    name: 'Temple Records',
    name_kannada: 'ದೇವಾಲಯ ದಾಖಲೆಗಳು',
    slug: 'temple-records',
    icon: 'star',
    color: '#d97706',
    description: 'Temple endowments, ritual calendars, assets, and dynastic contributions.',
    keywords: ['endowment', 'ritual calendar', 'temple asset', 'prashasti', 'sanctum']
  },
  {
    id: 'cat-5',
    name: 'Maps',
    name_kannada: 'ನಕ್ಷೆಗಳು',
    slug: 'maps',
    icon: 'compass',
    color: '#db2777',
    description: 'Topographical maps, boundary surveys, and historical forest maps.',
    keywords: ['topography', 'boundary', 'cartography', 'forest map', 'survey map']
  },
  {
    id: 'cat-6',
    name: 'Photographs',
    name_kannada: 'ಛಾಯಾಚಿತ್ರಗಳು',
    slug: 'photographs',
    icon: 'camera',
    color: '#0891b2',
    description: 'Archival photographs, historical prints, and visual media.',
    keywords: ['negative', 'print', 'monochrome', 'portrait', 'landscape']
  },
  {
    id: 'cat-7',
    name: 'Inscriptions',
    name_kannada: 'ಶಾಸನಗಳು',
    slug: 'inscriptions',
    icon: 'scroll',
    color: '#ea580c',
    description: 'Epigraphical records, hero stones, stone tablets, and copper plate inscriptions.',
    keywords: ['hero stone', 'stone tablet', 'copper plate', 'epigraphy', 'halmidi']
  },
  {
    id: 'cat-8',
    name: 'Government Orders',
    name_kannada: 'ಸರ್ಕಾರಿ ಆದೇಶಗಳು',
    slug: 'government-orders',
    icon: 'file-check',
    color: '#16a34a',
    description: 'Official state circulars, administrative mandates, and gazette notifications.',
    keywords: ['circular', 'mandate', 'gazette', 'notification', 'resolution']
  },
  {
    id: 'cat-9',
    name: 'Cultural Records',
    name_kannada: 'ಸಾಂಸ್ಕೃತಿಕ ದಾಖಲೆಗಳು',
    slug: 'cultural-records',
    icon: 'music',
    color: '#db2777',
    description: 'Documentation of local art, folklore, theatrical plays, music, and regional festivals.',
    keywords: ['folklore', 'yakshagana', 'theatre', 'festival', 'native song']
  },
  {
    id: 'cat-10',
    name: 'Education Records',
    name_kannada: 'ಶಿಕ್ಷಣ ದಾಖಲೆಗಳು',
    slug: 'education-records',
    icon: 'graduation-cap',
    color: '#4f46e5',
    description: 'Historical registries from colonial and post-independence schools and colleges.',
    keywords: ['registry', 'report card', 'syllabus', 'charter', 'alumni']
  },
  {
    id: 'cat-11',
    name: 'Revenue Records',
    name_kannada: 'ಕಂದಾಯ ದಾಖಲೆಗಳು',
    slug: 'revenue-records',
    icon: 'calculator',
    color: '#65a30d',
    description: 'Tax records, village account registers, and treasury logs.',
    keywords: ['tax log', 'treasury record', 'ledger', 'assessment', 'audit']
  },
  {
    id: 'cat-12',
    name: 'Court Records',
    name_kannada: 'ನ್ಯಾಯಾಲಯ ದಾಖಲೆಗಳು',
    slug: 'court-records',
    icon: 'scale',
    color: '#dc2626',
    description: 'Civil and criminal court judgments, decrees, and witness statements.',
    keywords: ['judgment', 'decree', 'witness statement', 'deposition', 'affidavit']
  },
  {
    id: 'cat-13',
    name: 'Palace Records',
    name_kannada: 'ಅರಮನೆ ದಾಖಲೆಗಳು',
    slug: 'palace-records',
    icon: 'bookmark',
    color: '#ca8a04',
    description: 'Royal administrative ledgers, diaries, and palace records from Mysore Palace.',
    keywords: ['Mysore Palace', 'royal diary', 'ledger', 'inventory', 'dynasty']
  },
  {
    id: 'cat-14',
    name: 'Military Records',
    name_kannada: 'ಸೇನಾ ದಾಖಲೆಗಳು',
    slug: 'military-records',
    icon: 'shield',
    color: '#b91c1c',
    description: 'Defense logs, battle maps, weapons treaties, and military personnel rolls.',
    keywords: ['battle map', 'treaty', 'roll call', 'muster roll', 'fortification']
  },
  {
    id: 'cat-15',
    name: 'Gazetteers',
    name_kannada: 'ಗೆಜೆಟಿಯರ್‌ಗಳು',
    slug: 'gazetteers',
    icon: 'book-open',
    color: '#7c3aed',
    description: 'Official publications detailing the geographical, historical, and demographic profile of Karnataka districts.',
    keywords: ['gazetteer', 'demographics', 'district profile', 'geography', 'statistics']
  },
  {
    id: 'cat-16',
    name: 'Kannada Literature',
    name_kannada: 'ಕನ್ನಡ ಸಾಹಿತ್ಯ',
    slug: 'kannada-literature',
    icon: 'book',
    color: '#0d9488',
    description: 'Classical and modern Kannada literary works, manuscripts, and poetry.',
    keywords: ['manuscript', 'poetry', 'epic', 'vachana', 'kavya', 'pampa']
  }
];

export const ARCHIVE_CATEGORIES = ARCHIVE_CATEGORIES_ALL;

/**
 * Normalizes a district name to match canonical districts
 */
export function normalizeDistrictName(name: string): string {
  if (!name) return 'Karnataka';
  const clean = name.trim().toLowerCase();
  
  if (clean === 'mysore' || clean === 'ಮೈಸೂರು') return 'Mysuru';
  if (clean === 'bangalore' || clean === 'bengaluru' || clean === 'bengaluru urban' || clean === 'ಬೆಂಗಳೂರು' || clean === 'ಬೆಂಗಳೂರು ನಗರ') return 'Bengaluru Urban';
  if (clean === 'tumkur' || clean === 'ತುಮಕೂರು') return 'Tumakuru';
  if (clean === 'shimoga' || clean === 'ಶಿವಮೊಗ್ಗ') return 'Shivamogga';
  if (clean === 'bijapur' || clean === 'vijayapura' || clean === 'ವಿಜಯಪುರ') return 'Vijayapura';
  if (clean === 'bellary' || clean === 'ballari' || clean === 'ಬಳ್ಳಾರಿ') return 'Ballari';
  if (clean === 'gulbarga' || clean === 'kalaburagi' || clean === 'ಕಲಬುರಗಿ') return 'Kalaburagi';
  if (clean === 'mangalore' || clean === 'mangaluru' || clean === 'ದಕ್ಷಿಣ ಕನ್ನಡ' || clean === 'dakshina kannada') return 'Dakshina Kannada';
  if (clean === 'belgaum' || clean === 'belagavi' || clean === 'ಬೆಳಗಾವಿ') return 'Belagavi';
  
  // Try to match in KARNATAKA_DISTRICTS_ALL
  const matched = KARNATAKA_DISTRICTS_ALL.find(d => d.name.toLowerCase() === clean);
  if (matched) return matched.name;

  // Title case fallback
  return name.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes a category name or slug to canonical slugs
 */
export function normalizeCategorySlug(category: string): string {
  if (!category) return 'land-records';
  const clean = category.trim().toLowerCase();

  // Handle common names to slugs
  if (clean === 'land records') return 'land-records';
  if (clean === 'administrative records') return 'administrative-records';
  if (clean === 'historical letters') return 'historical-letters';
  if (clean === 'temple records') return 'temple-records';
  if (clean === 'maps' || clean === 'maps & surveys' || clean === 'maps-surveys') return 'maps';
  if (clean === 'photographs') return 'photographs';
  if (clean === 'inscriptions') return 'inscriptions';
  if (clean === 'government orders') return 'government-orders';
  if (clean === 'cultural records') return 'cultural-records';
  if (clean === 'education records') return 'education-records';
  if (clean === 'revenue records') return 'revenue-records';
  if (clean === 'court records') return 'court-records';
  if (clean === 'palace records') return 'palace-records';
  if (clean === 'military records') return 'military-records';
  if (clean === 'gazetteers') return 'gazetteers';
  if (clean === 'kannada literature') return 'kannada-literature';

  const matched = ARCHIVE_CATEGORIES_ALL.find(c => c.slug === clean || c.name.toLowerCase() === clean);
  if (matched) return matched.slug;

  return 'land-records';
}
