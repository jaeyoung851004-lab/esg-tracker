import type { DashboardStats, NewsItem, Regulation } from "@/types/dashboard";
import regulationsData from "../../data/regulations.json";

type OldRegulation = {
  id: string;
  acronym?: string;
  name_ko?: string;
  name_en?: string;
  category?: string;
  legal?: {
    legal_state?: string;
    political_direction?: string;
    dates?: Record<
      string,
      | {
          date: string;
          label: string;
        }
      | undefined
    >;
    thresholds?: {
      scope?: string;
      exemptions?: string[];
    };
    sources?: {
      type?: string;
      org?: string;
      label: string;
      url: string;
    }[];
  };
  ai_layer?: {
    confidence?: string;
    confidence_reason?: string;
    situation_summary?: string;
    situation_detail?: string;
    key_points?: string[];
    affected_industries?: string[];
    uncertain_items?: string[];
  };
  news_config?: {
    search_queries?: string[];
    required_keywords?: string[];
    exclude_keywords?: string[];
  };
  history?: {
    date: string;
    event: string;
    source_type?: string;
    source_org?: string;
  }[];
  display?: {
    status_label?: string;
    status_tone?: string;
    card_date_label?: string;
    card_date_value?: string;
    priority?: string;
  };
  action_checkpoints?: {
    title?: string;
    items?: string[];
  };
  korean_company_note?: string;
  company_mapping?: {
    industries?: string[];
    company_size?: string[];
    risk_level?: string;
    relevance_note?: string;
  };
  why_it_matters?: string;
};

type RegulationsJson = {
  schema_version?: string;
  last_updated?: string;
  maintainer_note?: string;
  regulations: OldRegulation[];
};

const rawRegulations =
  (regulationsData as unknown as RegulationsJson).regulations ?? [];

const fallbackNews: NewsItem[] = [
  {
    id: "reuters-csrd-csddd",
    source: "Reuters",
    title: "EU Omnibus proposal to simplify CSRD and CSDDD published",
    age: "2일 전",
    url: "https://www.reuters.com/",
  },
  {
    id: "bloomberg-ifrs-s2",
    source: "Bloomberg",
    title: "ISSB unveils new sustainability disclosure standard (IFRS S2)",
    age: "3일 전",
    url: "https://www.bloomberg.com/",
  },
  {
    id: "ft-sec-climate",
    source: "Financial Times",
    title: "SEC delays climate disclosure rule implementation",
    age: "5일 전",
    url: "https://www.ft.com/",
  },
  {
    id: "euractiv-espr",
    source: "Euractiv",
    title: "ESPR delegated acts for textiles expected in 2026",
    age: "1주 전",
    url: "https://www.euractiv.com/",
  },
  {
    id: "guardian-cbam",
    source: "The Guardian",
    title: "EU adopts Carbon Border Adjustment Mechanism (CBAM) phase-in rules",
    age: "1주 전",
    url: "https://www.theguardian.com/",
  },
];

function normalizeStatusTone(tone?: string): string {
  if (!tone) return "warning";

  const map: Record<string, string> = {
    success: "success",
    stable: "success",
    partial: "partial",
    warning: "warning",
    delayed: "delayed",
    danger: "delayed",
    uncertain: "uncertain",
    neutral: "partial",
  };

  return map[tone] ?? tone;
}

function getDeadline(reg: OldRegulation): string {
  const dates = reg.legal?.dates;

  return (
    reg.display?.card_date_value ||
    dates?.application_date?.date ||
    dates?.entry_into_force?.date ||
    dates?.adopted?.date ||
    dates?.published_oj?.date ||
    "미정"
  );
}

function calculateDDay(dateText?: string): number {
  if (!dateText || dateText === "미정") return 999;

  const normalized = dateText.replace(/\./g, "-").trim();
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return 999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getCountry(reg: OldRegulation): string {
  const text = `${reg.name_en ?? ""} ${reg.name_ko ?? ""} ${
    reg.acronym ?? ""
  }`;

  if (
    text.includes("EU") ||
    [
      "ESPR",
      "PPWR",
      "CSDDD",
      "CSRD",
      "CBAM",
      "EUDR",
      "GCD",
      "Battery Reg",
      "DPP",
    ].includes(reg.acronym ?? "")
  ) {
    return "EU";
  }

  if (text.includes("ISSB")) return "Global";
  if (text.includes("SEC")) return "US";

  return "Global";
}

function getIndustry(reg: OldRegulation): string {
  return (
    reg.company_mapping?.industries?.join(", ") ||
    reg.ai_layer?.affected_industries?.join(", ") ||
    reg.legal?.thresholds?.scope ||
    "전 산업"
  );
}

function getRisk(reg: OldRegulation): string {
  return reg.company_mapping?.risk_level || "검토 필요";
}

function getReadiness(reg: OldRegulation): number {
  const tone = normalizeStatusTone(reg.display?.status_tone);

  if (tone === "success") return 75;
  if (tone === "partial") return 60;
  if (tone === "warning") return 45;
  if (tone === "uncertain") return 35;
  if (tone === "delayed") return 30;

  return 50;
}

function getPriority(reg: OldRegulation): string {
  return reg.display?.priority || "중간";
}

function convertRegulation(reg: OldRegulation): Regulation {
  const statusTone = normalizeStatusTone(reg.display?.status_tone);
  const primarySource = reg.legal?.sources?.[0];
  const deadline = getDeadline(reg);

  return {
    id: reg.id,
    code: reg.acronym ?? reg.id.toUpperCase(),
    title: reg.name_ko ?? reg.name_en ?? reg.acronym ?? reg.id,

    category: reg.category ?? "규제",
    country: getCountry(reg),
    industry: getIndustry(reg),

    status: reg.display?.status_label ?? reg.legal?.legal_state ?? "확인 필요",
    statusTone,

    deadline,
    dDay: calculateDDay(deadline),

    readiness: getReadiness(reg),
    risk: getRisk(reg),
    priority: getPriority(reg),

    summary:
      reg.ai_layer?.situation_summary ||
      reg.why_it_matters ||
      reg.korean_company_note ||
      "상세 정보 확인이 필요합니다.",

    acronym: reg.acronym,
    name_ko: reg.name_ko,
    name_en: reg.name_en,

    legal: reg.legal,
    ai_layer: reg.ai_layer,
    news_config: reg.news_config,
    history: reg.history,
    display: reg.display,
    action_checkpoints: reg.action_checkpoints,
    korean_company_note: reg.korean_company_note,
    company_mapping: reg.company_mapping,
    why_it_matters: reg.why_it_matters,

    key_points: reg.ai_layer?.key_points,
    card_date_label: reg.display?.card_date_label,
    card_date_value: reg.display?.card_date_value,
    official_url: primarySource?.url,
  };
}

const fallbackRegulations: Regulation[] = rawRegulations.map(convertRegulation);

export async function getRegulations(): Promise<Regulation[]> {
  return fallbackRegulations;
}

export async function getNews(): Promise<NewsItem[]> {
  return fallbackNews;
}

export async function getStats(): Promise<DashboardStats> {
  const total = fallbackRegulations.length || 1;

  return {
    totalRegulations: fallbackRegulations.length,
    urgentTasks: fallbackRegulations.filter(
      (item) =>
        typeof item.dDay === "number" && item.dDay >= 0 && item.dDay <= 120
    ).length,
    averageReadiness: Math.round(
      fallbackRegulations.reduce((sum, item) => sum + item.readiness, 0) / total
    ),
    highPriority: fallbackRegulations.filter(
      (item) => item.priority === "높음" || item.priority === "High"
    ).length,
  };
}
