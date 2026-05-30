export type RegulationId =
  | "csrd"
  | "cbam"
  | "csddd"
  | "espr"
  | "eudr"
  | "ai-act"
  | "issb"
  | "sec-climate"
  | "battery";

export type NewsItem = {
  titleKo: string;
  originalTitle: string;
  source: string;
  sourceCountryKo: string;
  publishedAt: string;
  url: string;
  regulationId: RegulationId;
  regulationName: string;
  stakeholderType: string;
  reactionType: string;
  countryKo: string;
  relevanceScore: number;
  languageKo?: string;
  translationStatus?: "번역 대기" | "번역 완료";
};

type NewsRegion = {
  hl: string;
  gl: string;
  ceid: string;
  countryKo: string;
  languageKo: string;
};

const COMMON_REGIONS: NewsRegion[] = [
  { hl: "en-US", gl: "US", ceid: "US:en", countryKo: "미국", languageKo: "영어" },
  { hl: "en-GB", gl: "GB", ceid: "GB:en", countryKo: "영국", languageKo: "영어" },
  { hl: "en", gl: "BE", ceid: "BE:en", countryKo: "EU/벨기에", languageKo: "영어" },
];

const REGULATION_EXTRA_REGIONS: Record<RegulationId, NewsRegion[]> = {
  csrd: [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
    { hl: "nl", gl: "NL", ceid: "NL:nl", countryKo: "네덜란드", languageKo: "네덜란드어" },
    { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
    { hl: "es", gl: "ES", ceid: "ES:es", countryKo: "스페인", languageKo: "스페인어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
  ],
  cbam: [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "pl", gl: "PL", ceid: "PL:pl", countryKo: "폴란드", languageKo: "폴란드어" },
    { hl: "tr", gl: "TR", ceid: "TR:tr", countryKo: "튀르키예", languageKo: "튀르키예어" },
    { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    { hl: "en-IN", gl: "IN", ceid: "IN:en", countryKo: "인도", languageKo: "영어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
  ],
  csddd: [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
    { hl: "nl", gl: "NL", ceid: "NL:nl", countryKo: "네덜란드", languageKo: "네덜란드어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
  ],
  espr: [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
    { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
    { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
  ],
  eudr: [
    { hl: "pt-BR", gl: "BR", ceid: "BR:pt-419", countryKo: "브라질", languageKo: "포르투갈어" },
    { hl: "id", gl: "ID", ceid: "ID:id", countryKo: "인도네시아", languageKo: "인도네시아어" },
    { hl: "en-MY", gl: "MY", ceid: "MY:en", countryKo: "말레이시아", languageKo: "영어" },
    { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
  ],
  "ai-act": [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
    { hl: "es", gl: "ES", ceid: "ES:es", countryKo: "스페인", languageKo: "스페인어" },
    { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
  ],
  issb: [
    { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
    { hl: "en-SG", gl: "SG", ceid: "SG:en", countryKo: "싱가포르", languageKo: "영어" },
    { hl: "en-AU", gl: "AU", ceid: "AU:en", countryKo: "호주", languageKo: "영어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
  ],
  "sec-climate": [
    { hl: "en-US", gl: "US", ceid: "US:en", countryKo: "미국", languageKo: "영어" },
  ],
  battery: [
    { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    { hl: "hu", gl: "HU", ceid: "HU:hu", countryKo: "헝가리", languageKo: "헝가리어" },
    { hl: "pl", gl: "PL", ceid: "PL:pl", countryKo: "폴란드", languageKo: "폴란드어" },
    { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
  ],
};

export const REGULATIONS: Record<RegulationId, { name: string; queries: string[] }> = {
  csrd: {
    name: "CSRD",
    queries: [
      `"CSRD"`,
      `"Corporate Sustainability Reporting Directive"`,
      `"CSRD" company response`,
      `"CSRD" audit assurance`,
      `"CSRD" delay`,
      `"CSRD" omnibus`,
      `"CSRD" supply chain`,
    ],
  },
  cbam: {
    name: "CBAM",
    queries: [
      `"CBAM"`,
      `"Carbon Border Adjustment Mechanism"`,
      `"CBAM" exporters`,
      `"CBAM" reporting obligation`,
      `"CBAM" steel`,
      `"CBAM" cement`,
    ],
  },
  csddd: {
    name: "CSDDD",
    queries: [
      `"CSDDD"`,
      `"Corporate Sustainability Due Diligence Directive"`,
      `"EU due diligence directive"`,
      `"CSDDD" supply chain`,
      `"CSDDD" delay`,
    ],
  },
  espr: {
    name: "ESPR",
    queries: [
      `"ESPR"`,
      `"Ecodesign for Sustainable Products Regulation"`,
      `"digital product passport"`,
      `"ESPR" textiles`,
    ],
  },
  eudr: {
    name: "EUDR",
    queries: [
      `"EUDR"`,
      `"EU Deforestation Regulation"`,
      `"EUDR" delay`,
      `"EUDR" compliance`,
      `"EUDR" coffee cocoa palm oil`,
    ],
  },
  "ai-act": {
    name: "EU AI Act",
    queries: [
      `"EU AI Act"`,
      `"Artificial Intelligence Act" Europe`,
      `"AI Act" compliance`,
      `"AI Act" companies`,
    ],
  },
  issb: {
    name: "ISSB",
    queries: [
      `"ISSB" sustainability disclosure`,
      `"IFRS S1"`,
      `"IFRS S2"`,
      `"ISSB" climate disclosure`,
    ],
  },
  "sec-climate": {
    name: "SEC Climate Rule",
    queries: [
      `"SEC climate disclosure rule"`,
      `"SEC climate rule"`,
      `"SEC" climate disclosure`,
    ],
  },
  battery: {
    name: "EU Battery Regulation",
    queries: [
      `"EU Battery Regulation"`,
      `"battery passport" EU`,
      `"Battery Regulation" due diligence`,
      `"EU battery rules"`,
    ],
  },
};

const NOISE_KEYWORDS = [
  "annual report",
  "sustainability report now available",
  "award",
  "premio",
  "webinar",
  "internship",
  "job",
  "career",
  "stock",
  "share price",
  "earnings",
  "tradingview",
  "sponsored",
];

type RawRssItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  region: NewsRegion;
};

function decodeXml(text: string) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", `"`)
    .replaceAll("&#39;", "'")
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "");
}

function getTagValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]?.trim() || "");
}

function getSourceValue(xml: string) {
  const match = xml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return decodeXml(match?.[1]?.trim() || "");
}

function getRegionsForRegulation(regulationId: RegulationId): NewsRegion[] {
  const merged = [...COMMON_REGIONS, ...(REGULATION_EXTRA_REGIONS[regulationId] || [])];

  return Array.from(new Map(merged.map((region) => [region.ceid, region])).values());
}

async function fetchGoogleNewsRss(
  query: string,
  region: NewsRegion
): Promise<RawRssItem[]> {
  const encodedQuery = encodeURIComponent(`${query} when:30d`);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google News RSS failed: ${response.status}`);
  }

  const xml = await response.text();
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  return itemBlocks.map((itemXml) => ({
    title: getTagValue(itemXml, "title"),
    link: getTagValue(itemXml, "link"),
    pubDate: getTagValue(itemXml, "pubDate"),
    source: getSourceValue(itemXml),
    region,
  }));
}

function isNoiseNews(title: string): boolean {
  const lower = title.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function classifyStakeholder(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes("commission") ||
    lower.includes("parliament") ||
    lower.includes("council") ||
    lower.includes("government") ||
    lower.includes("ministry") ||
    lower.includes("sec")
  ) return "정부/규제기관";

  if (
    lower.includes("company") ||
    lower.includes("corporate") ||
    lower.includes("manufacturer") ||
    lower.includes("supplier")
  ) return "기업";

  if (
    lower.includes("investor") ||
    lower.includes("bank") ||
    lower.includes("asset manager") ||
    lower.includes("finance")
  ) return "금융/투자자";

  if (
    lower.includes("law firm") ||
    lower.includes("legal") ||
    lower.includes("lawyer")
  ) return "로펌";

  if (
    lower.includes("consulting") ||
    lower.includes("deloitte") ||
    lower.includes("pwc") ||
    lower.includes("ey") ||
    lower.includes("kpmg") ||
    lower.includes("anthesis")
  ) return "컨설팅/회계법인";

  if (
    lower.includes("ngo") ||
    lower.includes("civil society") ||
    lower.includes("campaign")
  ) return "NGO/시민사회";

  if (
    lower.includes("association") ||
    lower.includes("industry group") ||
    lower.includes("trade body")
  ) return "산업협회";

  return "언론/시장";
}

function classifyReactionType(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("delay") || lower.includes("postpone") || lower.includes("extension")) return "시행 지연 요구";
  if (lower.includes("cost") || lower.includes("burden") || lower.includes("expensive")) return "비용 부담";
  if (lower.includes("supply chain") || lower.includes("supplier") || lower.includes("exporter")) return "공급망 영향";
  if (lower.includes("legal") || lower.includes("guidance") || lower.includes("interpretation")) return "법률 해석";
  if (lower.includes("investor") || lower.includes("risk") || lower.includes("finance")) return "투자 리스크";
  if (lower.includes("comply") || lower.includes("compliance") || lower.includes("prepare") || lower.includes("response")) return "기업 대응";
  if (lower.includes("rule") || lower.includes("regulation") || lower.includes("directive") || lower.includes("law")) return "규제 변화";

  return "시장 동향";
}

function detectCountryKo(text: string, fallbackCountryKo: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("korea") || lower.includes("south korea") || lower.includes("한국")) return "한국";
  if (lower.includes("japan") || lower.includes("日本")) return "일본";
  if (lower.includes("china") || lower.includes("中国")) return "중국";
  if (lower.includes("united states") || lower.includes(" u.s.") || lower.includes(" us ")) return "미국";
  if (lower.includes("united kingdom") || lower.includes(" uk ")) return "영국";
  if (lower.includes("germany") || lower.includes("deutschland")) return "독일";
  if (lower.includes("france")) return "프랑스";
  if (lower.includes("netherlands") || lower.includes("nederland")) return "네덜란드";
  if (lower.includes("italy") || lower.includes("italia")) return "이탈리아";
  if (lower.includes("spain") || lower.includes("españa")) return "스페인";
  if (lower.includes("brazil") || lower.includes("brasil")) return "브라질";
  if (lower.includes("mexico") || lower.includes("méxico")) return "멕시코";
  if (lower.includes("europe") || lower.includes("eu ")) return "EU/유럽";

  return fallbackCountryKo || "글로벌";
}

function sourceCountryKo(source: string, region: NewsRegion): string {
  const lower = source.toLowerCase();

  if (lower.includes("reuters")) return "글로벌";
  if (lower.includes("associated press") || lower.includes("ap news")) return "미국";
  if (lower.includes("bloomberg")) return "미국";
  if (lower.includes("financial times")) return "영국";
  if (lower.includes("the guardian")) return "영국";
  if (lower.includes("euractiv")) return "EU/유럽";
  if (lower.includes("politico")) return "미국/EU";
  if (lower.includes("le monde")) return "프랑스";
  if (lower.includes("handelsblatt")) return "독일";
  if (lower.includes("el país")) return "스페인";
  if (lower.includes("korea") || lower.includes("한국")) return "한국";
  if (lower.includes("japan") || lower.includes("日本")) return "일본";

  return region.countryKo;
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, "").trim();
}

function calculateRelevanceScore(title: string, regulationId: RegulationId): number {
  const lower = title.toLowerCase();
  const regulation = REGULATIONS[regulationId];

  let score = 0;

  if (lower.includes(regulation.name.toLowerCase())) score += 50;

  for (const query of regulation.queries) {
    const cleaned = query.replaceAll('"', "").toLowerCase();
    const parts = cleaned.split(" ");

    for (const part of parts) {
      if (part.length > 3 && lower.includes(part)) score += 5;
    }
  }

  if (isNoiseNews(title)) score -= 100;

  return score;
}

function getPublishedTime(item: NewsItem): number {
  const time = new Date(item.publishedAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export async function fetchGoogleNewsForRegulation(
  regulationId: RegulationId,
  limit = 10
): Promise<NewsItem[]> {
  const regulation = REGULATIONS[regulationId];
  const results: NewsItem[] = [];
  const regions = getRegionsForRegulation(regulationId);

  for (const region of regions) {
    for (const query of regulation.queries.slice(0, 4)) {
      try {
        const items = await fetchGoogleNewsRss(query, region);

        for (const item of items) {
          const originalTitle = cleanTitle(item.title);
          if (!originalTitle || isNoiseNews(originalTitle)) continue;

          const source = item.source || "Unknown";
          const combinedText = `${originalTitle} ${source}`;

          results.push({
            titleKo: originalTitle,
            originalTitle,
            source,
            sourceCountryKo: sourceCountryKo(source, item.region),
            publishedAt: item.pubDate || "",
            url: item.link || "",
            regulationId,
            regulationName: regulation.name,
            stakeholderType: classifyStakeholder(combinedText),
            reactionType: classifyReactionType(combinedText),
            countryKo: detectCountryKo(combinedText, item.region.countryKo),
            relevanceScore: calculateRelevanceScore(originalTitle, regulationId),
            languageKo: item.region.languageKo,
            translationStatus: "번역 대기",
          });
        }
      } catch (error) {
        console.error(`Google News fetch failed for ${regulationId}`, error);
      }
    }
  }

  const deduped = Array.from(
    new Map(results.map((item) => [item.url || item.originalTitle, item])).values()
  );

  return deduped
    .sort((a, b) => {
      const dateDiff = getPublishedTime(b) - getPublishedTime(a);
      if (dateDiff !== 0) return dateDiff;
      return b.relevanceScore - a.relevanceScore;
    })
    .slice(0, limit);
}

export async function fetchAllRegulationNews(limit = 10) {
  const regulationIds = Object.keys(REGULATIONS) as RegulationId[];

  const sections = await Promise.all(
    regulationIds.map(async (regulationId) => {
      const news = await fetchGoogleNewsForRegulation(regulationId, limit);

      return {
        regulationId,
        regulationName: REGULATIONS[regulationId].name,
        count: news.length,
        news,
      };
    })
  );

  return sections;
}
