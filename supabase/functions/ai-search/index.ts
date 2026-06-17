import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  limit?: number;
  page?: number;
  filters?: {
    category?: string;
    district?: string;
    language?: string;
    year_from?: number;
    year_to?: number;
  };
}

// Deterministic seeded random
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const DOC_TITLES = [
  "Survey Settlement Record", "Land Revenue Register", "Property Sale Deed", "Court Judgment",
  "Temple Endowment Grant", "Gazette Notification", "Census Enumeration Sheet", "Topographic Survey Map",
  "Kannada Manuscript", "Village Account Book", "Mutation Register", "Khata Certificate",
  "RTC Record", "Writ Petition Order", "Appeal Judgment", "Revenue Petition",
  "Forest Settlement Record", "Municipal Tax Register", "Boundary Demarcation Report",
  "Patta Passbook", "Encumbrance Certificate", "Sale Agreement", "Gift Deed",
  "Partition Deed", "Copper Plate Inscription", "Freedom Fighter Record", "Archaeological Survey",
  "Heritage Site Documentation", "Temple Consecration Record", "Village Settlement Register",
];

const TALUKS = [
  "Bengaluru North", "Bengaluru South", "Mysuru", "Mangaluru", "Hubballi",
  "Dharwad", "Shivamogga", "Hassan", "Mandya", "Tumakuru", "Davanagere",
  "Belagavi", "Kalaburagi", "Ballari", "Raichur", "Vijayapura", "Bagalkot",
  "Gadag", "Haveri", "Koppal", "Yadgir", "Bidar", "Chitradurga", "Ramanagara",
  "Kolar", "Chikkaballapur", "Udupi", "Karwar", "Madikeri", "Chikkamagaluru",
  "Hoskote", "Nelamangala", "Devanahalli", "Channapatna", "Magadi",
];

const YEARS = [1820, 1835, 1842, 1858, 1867, 1879, 1891, 1901, 1911, 1921, 1931, 1941, 1947, 1951, 1956, 1961, 1971, 1981, 1991, 2001, 2011, 2015, 2018, 2021];

const AUTHORS = [
  "District Collector", "Revenue Inspector", "Survey Commissioner", "High Court Registry",
  "Temple Executive Officer", "Census Superintendent", "Forest Settlement Officer",
  "Municipal Commissioner", "Tahsildar", "Village Accountant (Shanbhog)",
  "Settlement Commissioner", "Land Records Officer",
];

const DESCRIPTIONS = [
  "This document contains detailed survey and settlement records for the specified region of Karnataka. It includes boundary descriptions, land classifications, and ownership details as recorded by the British administration.",
  "Official revenue records maintained by the Karnataka Revenue Department. Contains land revenue assessments, tax collection records, and ownership transfer details for the specified taluk.",
  "Historical court document from the Karnataka judicial archives. Contains legal proceedings, evidence, arguments, and final judgment in the matter. Part of the Karnataka Judicial Heritage Collection.",
  "Ancient Kannada manuscript preserved in the Karnataka State Archives. Written in old Kannada script, this document provides insights into the cultural and social life of medieval Karnataka.",
  "Government gazette notification issued by the Government of Karnataka. Contains official orders, appointments, land acquisitions, and policy notifications.",
  "Temple record documenting the religious and administrative history of this sacred site. Includes details of endowments, rituals, festivals, and temple administration.",
  "Census enumeration records compiled during the national census. Contains demographic data, household information, and population statistics for the specified region.",
  "Survey and mapping records created by the Survey of India and Karnataka Survey Department. Includes topographic details, geographical features, and boundary markings.",
];

const DISTRICTS = [
  { name: "Bengaluru Urban", name_kannada: "ಬೆಂಗಳೂರು ನಗರ" },
  { name: "Mysuru", name_kannada: "ಮೈಸೂರು" },
  { name: "Belagavi", name_kannada: "ಬೆಳಗಾವಿ" },
  { name: "Dakshina Kannada", name_kannada: "ದಕ್ಷಿಣ ಕನ್ನಡ" },
  { name: "Ballari", name_kannada: "ಬಳ್ಳಾರಿ" },
  { name: "Kalaburagi", name_kannada: "ಕಲಬುರಗಿ" },
  { name: "Tumakuru", name_kannada: "ತುಮಕೂರು" },
  { name: "Shivamogga", name_kannada: "ಶಿವಮೊಗ್ಗ" },
  { name: "Vijayapura", name_kannada: "ವಿಜಯಪುರ" },
  { name: "Hassan", name_kannada: "ಹಾಸನ" },
  { name: "Dharwad", name_kannada: "ಧಾರವಾಡ" },
  { name: "Raichur", name_kannada: "ರಾಯಚೂರು" },
];

const CATEGORIES = [
  { name: "Land Records", name_kannada: "ಭೂ ದಾಖಲೆಗಳು", slug: "land-records", color: "#0ea5e9" },
  { name: "Court Records", name_kannada: "ನ್ಯಾಯಾಲಯ ದಾಖಲೆಗಳು", slug: "court-records", color: "#dc2626" },
  { name: "Temple Records", name_kannada: "ದೇವಾಲಯ ದಾಖಲೆಗಳು", slug: "temple-records", color: "#d97706" },
  { name: "Gazette Notifications", name_kannada: "ಸರ್ಕಾರಿ ಗೆಜೆಟ್", slug: "gazette-notifications", color: "#7c3aed" },
  { name: "Manuscripts", name_kannada: "ಹಸ್ತಪ್ರತಿಗಳು", slug: "manuscripts", color: "#059669" },
  { name: "Census Records", name_kannada: "ಜನಗಣತಿ ದಾಖಲೆಗಳು", slug: "census-records", color: "#2563eb" },
  { name: "Maps & Surveys", name_kannada: "ನಕ್ಷೆಗಳು ಮತ್ತು ಸರ್ವೆ", slug: "maps-surveys", color: "#db2777" },
  { name: "Kannada Literature", name_kannada: "ಕನ್ನಡ ಸಾಹಿತ್ಯ", slug: "kannada-literature", color: "#0891b2" },
  { name: "Revenue Records", name_kannada: "ಕಂದಾಯ ದಾಖಲೆಗಳು", slug: "revenue-records", color: "#65a30d" },
  { name: "Archaeological Records", name_kannada: "ಪುರಾತತ್ತ್ವ ದಾಖಲೆಗಳು", slug: "archaeological-records", color: "#9333ea" },
  { name: "Freedom Movement", name_kannada: "ಸ್ವಾತಂತ್ರ್ಯ ಚಳವಳಿ", slug: "freedom-movement", color: "#ea580c" },
  { name: "Administrative Records", name_kannada: "ಆಡಳಿತ ದಾಖಲೆಗಳು", slug: "administrative-records", color: "#64748b" },
];

const DOC_TYPES = ["land_deed", "court_order", "manuscript", "gazette", "survey_map", "census_form", "revenue_register", "temple_record"];

function generateMockArchive(index: number) {
  const r = (n: number) => seededRandom(index * 137 + n);
  const districtIdx = Math.floor(r(1) * DISTRICTS.length);
  const categoryIdx = Math.floor(r(2) * CATEGORIES.length);
  const yearIdx = Math.floor(r(3) * YEARS.length);
  const talukIdx = Math.floor(r(4) * TALUKS.length);
  const titleIdx = Math.floor(r(5) * DOC_TITLES.length);
  const authorIdx = Math.floor(r(6) * AUTHORS.length);
  const descIdx = Math.floor(r(7) * DESCRIPTIONS.length);
  const year = YEARS[yearIdx];
  const district = DISTRICTS[districtIdx];
  const category = CATEGORIES[categoryIdx];

  return {
    id: `arch-${index + 1}`,
    accession_number: `KAR-${String(index + 1).padStart(8, "0")}`,
    title: `${DOC_TITLES[titleIdx]} - ${TALUKS[talukIdx]} ${year}`,
    title_kannada: `ದಾಖಲೆ - ${TALUKS[talukIdx]} ${year}`,
    description: DESCRIPTIONS[descIdx],
    year,
    decade: `${Math.floor(year / 10) * 10}s`,
    language: r(10) > 0.4 ? "kannada" : r(10) > 0.2 ? "english" : "both",
    document_type: DOC_TYPES[Math.floor(r(11) * 8)],
    file_type: r(12) > 0.3 ? "pdf" : "image",
    page_count: Math.floor(r(13) * 50) + 1,
    author: AUTHORS[authorIdx],
    source: "Karnataka State Archives",
    taluk: TALUKS[talukIdx],
    view_count: Math.floor(r(14) * 5000),
    download_count: Math.floor(r(15) * 1000),
    relevance_score: 0.3 + r(16) * 0.7,
    is_featured: r(17) > 0.95,
    has_ocr: r(18) > 0.3,
    has_embedding: r(19) > 0.5,
    access_level: r(20) > 0.1 ? "public" : "restricted",
    status: "active",
    tags: ["karnataka", category.slug, year.toString()],
    district: { id: `dist-${districtIdx + 1}`, ...district, division: "Karnataka", headquarter: district.name, taluk_count: 5, area_sqkm: 5000, population: 1000000 },
    category: { id: `cat-${categoryIdx + 1}`, ...category, icon: "folder", record_count: 50000, description: "" },
    metadata: {
      digitization_quality: r(21) > 0.6 ? "high" : "medium",
      preservation_status: r(22) > 0.5 ? "good" : "fair",
    },
    created_at: new Date(Date.now() - Math.floor(r(23) * 1000 * 60 * 60 * 24 * 365 * 5)).toISOString(),
  };
}

function scoreArchive(archive: Record<string, unknown>, searchTerms: string[]): number {
  let score = 0;
  const title = String(archive.title || "").toLowerCase();
  const desc = String(archive.description || "").toLowerCase();
  const taluk = String(archive.taluk || "").toLowerCase();
  const author = String(archive.author || "").toLowerCase();
  const tags = (archive.tags as string[]) || [];
  const category = archive.category as Record<string, string>;
  const district = archive.district as Record<string, string>;

  for (const term of searchTerms) {
    const t = term.toLowerCase().trim();
    if (!t) continue;

    // Title match (highest weight)
    if (title.includes(t)) score += 10;
    // Description match
    if (desc.includes(t)) score += 5;
    // Taluk match
    if (taluk.includes(t)) score += 4;
    // Author match
    if (author.includes(t)) score += 3;
    // Tag match
    if (tags.some(tag => tag.toLowerCase().includes(t))) score += 3;
    // Category name match
    if (category?.name?.toLowerCase().includes(t)) score += 4;
    if (category?.slug?.toLowerCase().includes(t)) score += 4;
    // District name match
    if (district?.name?.toLowerCase().includes(t)) score += 4;
  }

  // Add base relevance score
  score += Number(archive.relevance_score || 0) * 2;

  return score;
}

function normalizeSearchQuery(input: string) {
  const aliases: Record<string, string> = {
    bangalore: "bengaluru",
    bengalore: "bengaluru",
    benglore: "bengaluru",
    banglore: "bengaluru",
    mysore: "mysuru",
    belgaum: "belagavi",
    bellary: "ballari",
    gulbarga: "kalaburagi",
    mangalore: "mangaluru",
  };

  const rawTerms = input
    .toLowerCase()
    .split(/[\s,\.]+/)
    .filter(t => t.length > 2);
  const normalizedTerms = rawTerms.map(term => aliases[term] || term);
  const corrections = rawTerms
    .map((term, index) => term !== normalizedTerms[index] ? `${term} -> ${normalizedTerms[index]}` : "")
    .filter(Boolean);
  const districtMap: Record<string, string[]> = {
    bengaluru: ["Bengaluru Urban", "Bengaluru Rural"],
    mysuru: ["Mysuru"],
    belagavi: ["Belagavi"],
    ballari: ["Ballari"],
    kalaburagi: ["Kalaburagi"],
    mangaluru: ["Dakshina Kannada"],
  };
  const suggestedDistricts = Array.from(new Set(normalizedTerms.flatMap(term => districtMap[term] || [])));

  return {
    terms: Array.from(new Set([...rawTerms, ...normalizedTerms])),
    normalizedQuery: normalizedTerms.join(" "),
    corrections,
    suggestedDistricts,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let body: SearchRequest;
    if (req.method === "POST") {
      body = await req.json();
    } else {
      const url = new URL(req.url);
      body = {
        query: url.searchParams.get("q") || "",
        limit: parseInt(url.searchParams.get("limit") || "20"),
        page: parseInt(url.searchParams.get("page") || "1"),
      };
    }

    const { query, limit = 20, page = 1, filters } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract search terms from query with common Karnataka place-name corrections.
    const normalized = normalizeSearchQuery(query);
    const searchTerms = normalized.terms;

    // Guess suggested categories based on keywords
    const suggestedCategorySlugs: string[] = [];
    if (query.match(/land|property|deed|survey|settlement/i)) suggestedCategorySlugs.push("land-records");
    if (query.match(/court|judge|law|legal|petition|judgment|writ/i)) suggestedCategorySlugs.push("court-records");
    if (query.match(/temple|religious|endowment|shrine|priest/i)) suggestedCategorySlugs.push("temple-records");
    if (query.match(/gazette|notification|official|government|order/i)) suggestedCategorySlugs.push("gazette-notifications");
    if (query.match(/manuscript|ancient|text|script|kannada|literature/i)) suggestedCategorySlugs.push("manuscripts");
    if (query.match(/census|population|demographic|enumeration/i)) suggestedCategorySlugs.push("census-records");
    if (query.match(/map|survey|geographic|topographic|boundary/i)) suggestedCategorySlugs.push("maps-surveys");
    if (query.match(/revenue|tax|assessment|record/i)) suggestedCategorySlugs.push("revenue-records");
    if (query.match(/archaeological|heritage|artifact|historical/i)) suggestedCategorySlugs.push("archaeological-records");
    if (query.match(/freedom|independence|movement|struggle/i)) suggestedCategorySlugs.push("freedom-movement");

    // Guess suggested districts
    const suggestedDistrictNames: string[] = [];
    if (query.match(/bengaluru|bangalore|bengalore|benglore|banglore/i)) suggestedDistrictNames.push("Bengaluru Urban");
    if (query.match(/mysuru|mysore/i)) suggestedDistrictNames.push("Mysuru");
    if (query.match(/belagavi|belgaum/i)) suggestedDistrictNames.push("Belagavi");
    if (query.match(/dakshina kannada|mangalore/i)) suggestedDistrictNames.push("Dakshina Kannada");
    if (query.match(/ballari|bellary/i)) suggestedDistrictNames.push("Ballari");
    if (query.match(/kalaburagi|gulbarga/i)) suggestedDistrictNames.push("Kalaburagi");
    suggestedDistrictNames.push(...normalized.suggestedDistricts.filter(d => !suggestedDistrictNames.includes(d)));

    // Generate 500 mock archives and score them
    const allArchives: Record<string, unknown>[] = [];
    for (let i = 0; i < 500; i++) {
      allArchives.push(generateMockArchive(i));
    }

    // Score and filter
    const scored = allArchives
      .map(a => ({
        ...a,
        _score: scoreArchive(a, searchTerms),
      }))
      .filter(a => Number(a._score) > 0)
      .sort((a, b) => Number(b._score) - Number(a._score));

    // Apply filters
    let filtered = scored;
    if (filters?.category) {
      filtered = filtered.filter(a => {
        const cat = a.category as Record<string, string>;
        return cat?.slug?.includes(filters.category!.toLowerCase());
      });
    }
    if (filters?.district) {
      filtered = filtered.filter(a => {
        const dist = a.district as Record<string, string>;
        return dist?.name?.toLowerCase().includes(filters.district!.toLowerCase());
      });
    }
    if (filters?.year_from) {
      filtered = filtered.filter(a => Number(a.year) >= filters.year_from!);
    }
    if (filters?.year_to) {
      filtered = filtered.filter(a => Number(a.year) <= filters.year_to!);
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const results = filtered.slice(offset, offset + limit).map(({ _score, ...rest }) => rest);

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        ai: {
          search_terms: searchTerms,
          suggested_categories: suggestedCategorySlugs,
          suggested_districts: suggestedDistrictNames,
          explanation: normalized.corrections.length
            ? `Corrected ${normalized.corrections.join(", ")} and searched matching Bengaluru archive records.`
            : `Found ${total} archives matching your search for "${query}"`,
          normalized_query: normalized.normalizedQuery,
          corrections: normalized.corrections,
          is_kannada_query: /[ಀ-ೃ]/.test(query),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
