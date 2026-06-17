export const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 
  'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 
  'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 
  'Vijayapura', 'Yadgir', 'Vijayanagara'
];

export const RELEVANCE_KEYWORDS = [
  'karnataka',
  'mysuru', 'mysore',
  'bengaluru', 'bangalore',
  'hampi',
  'vijayanagara',
  'wadiyar', 'wodeyar',
  'hoysala',
  'chalukya',
  'kadamba',
  'kannada',
  'srirangapatna', 'seringapatam',
  'belur',
  'halebidu', 'halebeedu',
  'pattadakal',
  'badami',
  'udupi',
  'dharwad',
  'mangaluru', 'mangalore',
  'government of karnataka',
  'karnataka gazette',
  'karnataka state gazetteer',
  'gazetteer',
  'south kanara',
  'bellary',
  'belgaum',
  'gulbarga',
  'bijapur',
  'shimoga'
];

export interface RelevanceResult {
  status: 'verified' | 'needs_review' | 'rejected';
  score: number;
  matchedKeywords: string[];
  matchedDistricts: string[];
}

export function validateKarnatakaRelevance(title: string, content: string): RelevanceResult {
  const normalizedTitle = title.toLowerCase();
  const normalizedContent = content.toLowerCase();
  const fullText = `${normalizedTitle} ${normalizedContent}`;

  // 1. Check for District Matches
  const matchedDistricts: string[] = [];
  for (const district of KARNATAKA_DISTRICTS) {
    // Escape regex characters just in case, though district names are simple
    const regex = new RegExp(`\\b${district.toLowerCase()}\\b`, 'i');
    if (regex.test(fullText)) {
      matchedDistricts.push(district);
    }
  }

  // Also support historical spellings of districts as direct matches
  const historicalDistrictMaps: { [key: string]: string } = {
    'mysore': 'Mysuru',
    'bangalore': 'Bengaluru Urban',
    'bellary': 'Ballari',
    'belgaum': 'Belagavi',
    'gulbarga': 'Kalaburagi',
    'bijapur': 'Vijayapura',
    'shimoga': 'Shivamogga',
    'mangalore': 'Dakshina Kannada'
  };

  for (const [oldName, currentName] of Object.entries(historicalDistrictMaps)) {
    const regex = new RegExp(`\\b${oldName}\\b`, 'i');
    if (regex.test(fullText) && !matchedDistricts.includes(currentName)) {
      matchedDistricts.push(currentName);
    }
  }

  // 2. Check for Keyword Matches
  const matchedKeywords: string[] = [];
  for (const keyword of RELEVANCE_KEYWORDS) {
    const regex = new RegExp(keyword === 'kannada' ? `\\b${keyword}\\b` : keyword, 'i');
    if (regex.test(fullText)) {
      matchedKeywords.push(keyword);
    }
  }

  // Calculate score and classification status
  const keywordCount = matchedKeywords.length;
  const hasDistrict = matchedDistricts.length > 0;

  let status: 'verified' | 'needs_review' | 'rejected' = 'rejected';
  let score = 0.0;

  if (hasDistrict || keywordCount >= 4) {
    status = 'verified';
    // score is high
    const baseScore = hasDistrict ? 0.75 : 0.60;
    score = Math.min(1.0, baseScore + (keywordCount * 0.05));
  } else if (keywordCount >= 1) {
    status = 'needs_review';
    score = 0.25 + (keywordCount * 0.10);
  } else {
    status = 'rejected';
    score = 0.05;
  }

  // Double check if any extremely specific terms are present to bump score
  const ultraSpecific = ['karnataka gazette', 'karnataka state gazetteer', 'government of karnataka', 'vijayanagara empire'];
  const hasUltra = ultraSpecific.some(term => normalizedTitle.includes(term) || normalizedContent.includes(term));
  if (hasUltra) {
    status = 'verified';
    score = Math.max(score, 0.85);
  }

  return {
    status,
    score: parseFloat(score.toFixed(2)),
    matchedKeywords,
    matchedDistricts
  };
}
