import Parser from "rss-parser";

const parser = new Parser();

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
};

export const REGULATIONS: Record<
  RegulationId,
  { name: string; queries: string[] }
> = {
  csrd: {
    name: "CSRD",
    queries: [
      `"CSRD"`,
      `"Corporate Sustainability Reporting Directive"`,
      `"CSRD" company response`,
      `"CSRD" audit assurance`,
      `"CSRD" delay`,
      `"CSRD" global companies`,
    ],
  },
  cbam: {
    name: "CBAM",
    queries: [
      `"CBAM"`,
      `"Carbon Border Adjustment Mechanism"`,
      `"CBAM" exporters`,
      `"CBAM" steel cement aluminum`,
      `"CBAM" reporting obligation`,
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
      `"climate disclosure rule" companies`,
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

function isNoiseNews(title: string): boolean {
  const lower = title.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function classifyStakeholder(title: string): string {
  const lower = title.toLowerCase();

  if (
    lower.includes("commission") ||
    lower.includes("parliament") ||
    lower.includes("council") ||
    lower.includes("government") ||
    lower.includes("ministry") ||
    lower.includes("sec")
  ) {
    return "정부/규제기관";
  }

  if (
    lower.includes("company") ||
    lower.includes("corporate") ||
    lower.includes("manufacturer") ||
    lower.includes("supplier")
  ) {
    return "기업";
  }

  if (
    lower.includes("investor") ||
    lower.includes("bank") ||
    lower.includes("asset manager") ||
    lower.includes("finance")
  ) {
    return "금융/투자자";
  }

  if (
    lower.includes("law firm") ||
    lower.includes("legal") ||
    lower.includes("lawyer")
  ) {
    return "로펌";
  }

  if (
    lower.includes("consulting") ||
    lower.includes("deloitte") ||
    lower.includes("pwc") ||
    lower.includes("ey") ||
    lower.includes("kpmg")
  ) {
    return "컨설팅/회계법인";
  }

  if (
    lower.includes("ngo") ||
    lower.includes("civil society") ||
    lower.includes("campaign")
  ) {
    return "NGO/시민사회";
  }

  if (
    lower.includes("association") ||
    lower.includes("industry group") ||
    lower.includes("trade body")
  ) {
    return "산업협회";
  }

  return "언론/시장";
}

function classifyReactionType(title: string): string {
  const lower = title.toLowerCase();

  if (
    lower.includes("delay") ||
    lower.includes("postpone") ||
    lower.includes("extension")
  ) {
    return "시행 지연 요구";
  }

  if (
    lower.includes("cost") ||
    lower.includes("burden") ||
    lower.includes("expensive")
  ) {
    return "비용 부담";
  }

  if (
    lower.includes("supply chain") ||
    lower.includes("supplier") ||
    lower.includes("exporter")
  ) {
    return "공급망 영향";
  }

  if (
    lower.includes("legal") ||
    lower.includes("guidance") ||
    lower.includes("interpretation")
  ) {
    return "법률 해석";
  }

  if (
    lower.includes("investor") ||
    lower.includes("risk") ||
    lower.includes("finance")
  ) {
    return "투자 리스크";
  }

  if (
    lower.includes("comply") ||
    lower.includes("compliance") ||
    lower.includes("prepare") ||
    lower.includes("response")
  ) {
    return "기업 대응";
  }

  if (
    lower.includes("rule") ||
    lower.includes("regulation") ||
    lower.includes("directive") ||
    lower.includes("law")
  ) {
    return "규제 변화";
  }

  return "시장 동향";
}

function detectCountryKo(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("korea") || lower.includes("south korea")) return "한국";
  if (lower.includes("japan")) return "일본";
  if (lower.includes("china")) return "중국";
  if (lower.includes("united states") || lower.includes(" u.s.") || lower.includes(" us ")) return "미국";
  if (lower.includes("united kingdom") || lower.includes(" uk ")) return "영국";
  if (lower.includes("germany")) return "독일";
  if (lower.includes("france")) return "프랑스";
  if (lower.includes("netherlands")) return "네덜란드";
  if (lower.includes("italy")) return "이탈리아";
  if (lower.includes("spain")) return "스페인";
  if (lower.includes("europe") || lower.includes("eu ")) return "EU/유럽";

  return "글로벌";
}

function sourceCountryKo(source: string): string {
  const lower = source.toLowerCase();

  if (lower.includes("reuters")) return "글로벌";
  if (lower.includes("bloomberg")) return "미국";
  if (lower.includes("financial times")) return "영국";
  if (lower.includes("euractiv")) return "EU/유럽";
  if (lower.includes("politico")) return "미국/EU";
  if (lower.includes("korea")) return "한국";
  if (lower.includes("japan")) return "일본";

  return "미확인";
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

function extractSource(item: any): string {
  if (item.source?.title) return item.source.title;

  const title = item.title || "";
  const match = title.match(/ - ([^-]+)$/);
  if (match?.[1]) return match[1].trim();

  return "Unknown";
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, "").trim();
}

function makeGoogleNewsRssUrl(query: string, limit: number) {
  const encodedQuery = encodeURIComponent(`${query} when:30d`);
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
}

export async function fetchGoogleNewsForRegulation(
  regulationId: RegulationId,
  limit = 5
): Promise<NewsItem[]> {
  const regulation = REGULATIONS[regulationId];
  const results: NewsItem[] = [];

  for (const query of regulation.queries.slice(0, 3)) {
    const url = makeGoogleNewsRssUrl(query, limit);

    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        const originalTitle = cleanTitle(item.title || "");
        if (!originalTitle || isNoiseNews(originalTitle)) continue;

        const source = extractSource(item);
        const combinedText = `${originalTitle} ${source}`;

        const news: NewsItem = {
          titleKo: originalTitle,
          originalTitle,
          source,
          sourceCountryKo: sourceCountryKo(source),
          publishedAt: item.isoDate || item.pubDate || "",
          url: item.link || "",
          regulationId,
          regulationName: regulation.name,
          stakeholderType: classifyStakeholder(combinedText),
          reactionType: classifyReactionType(combinedText),
          countryKo: detectCountryKo(combinedText),
          relevanceScore: calculateRelevanceScore(originalTitle, regulationId),
        };

        results.push(news);
      }
    } catch (error) {
      console.error(`Google News fetch failed for ${regulationId}`, error);
    }
  }

  const deduped = Array.from(
    new Map(results.map((item) => [item.url || item.originalTitle, item])).values()
  );

  return deduped
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

export async function fetchAllRegulationNews(limit = 5) {
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
