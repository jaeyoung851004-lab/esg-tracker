export type RegulationId =
  | "csrd"
  | "csddd"
  | "cbam"
  | "espr"
  | "eudr"
  | "ai-act"
  | "battery"
  | "ppwr"
  | "gcd"
  | "dpp";

export type RegulationStatus =
  | "단계적 시행"
  | "축소·지연"
  | "유예"
  | "유예/불확실";

export type RegulationCategory =
  | "공시·보고"
  | "공급망 실사"
  | "탄소·기후"
  | "순환경제"
  | "그린워싱 방지"
  | "AI·디지털"
  | "디지털 전환·제품";

export type ImpactRegion = {
  hl: string;
  gl: string;
  ceid: string;
  countryKo: string;
  languageKo: string;
};

export type RegulationMaster = {
  id: RegulationId;
  code: string;
  nameKo: string;
  nameEn: string;
  shortDescriptionKo: string;
  category: RegulationCategory;
  status: RegulationStatus;
  dday?: number;
  newsEnabled: boolean;
  aliases: string[];
  newsQueries: string[];
  impactRegions: ImpactRegion[];
  falsePositiveKeywords: string[];
};

export const COMMON_NEWS_REGIONS: ImpactRegion[] = [
  { hl: "en-US", gl: "US", ceid: "US:en", countryKo: "미국", languageKo: "영어" },
  { hl: "en-GB", gl: "GB", ceid: "GB:en", countryKo: "영국", languageKo: "영어" },
  { hl: "en", gl: "BE", ceid: "BE:en", countryKo: "EU/벨기에", languageKo: "영어" },
];

export const REGULATION_MASTER: RegulationMaster[] = [
  {
    id: "espr",
    code: "ESPR",
    nameKo: "지속가능제품 에코디자인 규정",
    nameEn: "Ecodesign for Sustainable Products Regulation",
    shortDescriptionKo: "순환경제",
    category: "순환경제",
    status: "단계적 시행",
    newsEnabled: true,
    aliases: ["ESPR", "Ecodesign for Sustainable Products Regulation"],
    newsQueries: [
      `"Ecodesign for Sustainable Products Regulation"`,
      `"ESPR" "ecodesign"`,
      `"ESPR" "sustainable products"`,
      `"ESPR" "unsold consumer products"`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
      { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    ],
    falsePositiveKeywords: [
      "esperion",
      "nasdaq",
      "stock",
      "shareholder",
      "investor alert",
      "buyout",
      "archimed",
      "therapeutics",
      "cash deal",
      "cvrs",
    ],
  },
  {
    id: "ppwr",
    code: "PPWR",
    nameKo: "포장재 및 포장폐기물 규정",
    nameEn: "Packaging and Packaging Waste Regulation",
    shortDescriptionKo: "순환경제",
    category: "순환경제",
    status: "단계적 시행",
    dday: -73,
    newsEnabled: true,
    aliases: ["PPWR", "Packaging and Packaging Waste Regulation"],
    newsQueries: [
      `"PPWR"`,
      `"Packaging and Packaging Waste Regulation"`,
      `"EU packaging regulation"`,
      `"PPWR" recycling`,
      `"PPWR" packaging waste`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
      { hl: "es", gl: "ES", ceid: "ES:es", countryKo: "스페인", languageKo: "스페인어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    ],
    falsePositiveKeywords: ["award", "webinar", "job", "career"],
  },
  {
    id: "csddd",
    code: "CSDDD",
    nameKo: "기업 지속가능성 실사 지침",
    nameEn: "Corporate Sustainability Due Diligence Directive",
    shortDescriptionKo: "공급망 실사",
    category: "공급망 실사",
    status: "축소·지연",
    newsEnabled: true,
    aliases: ["CSDDD", "CS3D", "Corporate Sustainability Due Diligence Directive"],
    newsQueries: [
      `"CSDDD"`,
      `"Corporate Sustainability Due Diligence Directive"`,
      `"EU due diligence directive"`,
      `"CSDDD" supply chain`,
      `"CSDDD" delay`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "nl", gl: "NL", ceid: "NL:nl", countryKo: "네덜란드", languageKo: "네덜란드어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
      { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
    ],
    falsePositiveKeywords: ["funding opportunity", "call for proposals"],
  },
  {
    id: "csrd",
    code: "CSRD",
    nameKo: "기업 지속가능성 보고 지침",
    nameEn: "Corporate Sustainability Reporting Directive",
    shortDescriptionKo: "공시·보고",
    category: "공시·보고",
    status: "축소·지연",
    dday: -580,
    newsEnabled: true,
    aliases: ["CSRD", "Corporate Sustainability Reporting Directive"],
    newsQueries: [
      `"Corporate Sustainability Reporting Directive"`,
      `"CSRD" "sustainability reporting"`,
      `"CSRD" "ESRS"`,
      `"CSRD" omnibus`,
      `"CSRD" assurance`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "nl", gl: "NL", ceid: "NL:nl", countryKo: "네덜란드", languageKo: "네덜란드어" },
      { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
      { hl: "es", gl: "ES", ceid: "ES:es", countryKo: "스페인", languageKo: "스페인어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
      { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
    ],
    falsePositiveKeywords: [
      "csrd, bc",
      "columbia shuswap",
      "boil water",
      "cedar heights",
      "falkland fire",
      "wildland truck",
      "community halls",
      "referendums",
    ],
  },
  {
    id: "cbam",
    code: "CBAM",
    nameKo: "탄소국경조정메커니즘",
    nameEn: "Carbon Border Adjustment Mechanism",
    shortDescriptionKo: "탄소·기후",
    category: "탄소·기후",
    status: "단계적 시행",
    dday: -246,
    newsEnabled: true,
    aliases: ["CBAM", "Carbon Border Adjustment Mechanism", "carbon border tax"],
    newsQueries: [
      `"CBAM"`,
      `"Carbon Border Adjustment Mechanism"`,
      `"carbon border tax" EU`,
      `"CBAM" steel`,
      `"CBAM" exporters`,
      `"CBAM" certificate`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "pl", gl: "PL", ceid: "PL:pl", countryKo: "폴란드", languageKo: "폴란드어" },
      { hl: "tr", gl: "TR", ceid: "TR:tr", countryKo: "튀르키예", languageKo: "튀르키예어" },
      { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
      { hl: "en-IN", gl: "IN", ceid: "IN:en", countryKo: "인도", languageKo: "영어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    ],
    falsePositiveKeywords: ["sports", "fortune cookie", "운은 가만히"],
  },
  {
    id: "eudr",
    code: "EUDR",
    nameKo: "EU 산림벌채 규정",
    nameEn: "EU Deforestation Regulation",
    shortDescriptionKo: "공급망·생물다양성",
    category: "공급망 실사",
    status: "유예",
    dday: -213,
    newsEnabled: true,
    aliases: ["EUDR", "EU Deforestation Regulation", "deforestation-free products"],
    newsQueries: [
      `"EUDR"`,
      `"EU Deforestation Regulation"`,
      `"deforestation-free products"`,
      `"EUDR" coffee`,
      `"EUDR" cocoa`,
      `"EUDR" palm oil`,
    ],
    impactRegions: [
      { hl: "pt-BR", gl: "BR", ceid: "BR:pt-419", countryKo: "브라질", languageKo: "포르투갈어" },
      { hl: "id", gl: "ID", ceid: "ID:id", countryKo: "인도네시아", languageKo: "인도네시아어" },
      { hl: "en-MY", gl: "MY", ceid: "MY:en", countryKo: "말레이시아", languageKo: "영어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
    ],
    falsePositiveKeywords: ["eurinary data regulations"],
  },
  {
    id: "gcd",
    code: "GCD",
    nameKo: "그린 클레임 지침",
    nameEn: "Green Claims Directive",
    shortDescriptionKo: "그린워싱 방지",
    category: "그린워싱 방지",
    status: "유예/불확실",
    newsEnabled: true,
    aliases: ["GCD", "Green Claims Directive", "greenwashing directive"],
    newsQueries: [
      `"Green Claims Directive"`,
      `"green claims" EU directive`,
      `"greenwashing" "EU" "claims"`,
      `"environmental claims" "EU"`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    ],
    falsePositiveKeywords: ["gcd calculator", "greatest common divisor"],
  },
  {
    id: "ai-act",
    code: "AI Act",
    nameKo: "EU AI 법",
    nameEn: "EU Artificial Intelligence Act",
    shortDescriptionKo: "AI·디지털",
    category: "AI·디지털",
    status: "단계적 시행",
    dday: -63,
    newsEnabled: true,
    aliases: ["EU AI Act", "Artificial Intelligence Act", "AI Act"],
    newsQueries: [
      `"EU AI Act"`,
      `"Artificial Intelligence Act" Europe`,
      `"AI Act" compliance`,
      `"AI Act" high-risk AI`,
      `"AI Act" transparency`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "es", gl: "ES", ceid: "ES:es", countryKo: "스페인", languageKo: "스페인어" },
      { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
    ],
    falsePositiveKeywords: ["recruiting job", "music act", "stage act"],
  },
  {
    id: "battery",
    code: "Battery Reg",
    nameKo: "배터리 규정",
    nameEn: "EU Battery Regulation",
    shortDescriptionKo: "순환경제·배터리",
    category: "순환경제",
    status: "단계적 시행",
    dday: -263,
    newsEnabled: true,
    aliases: ["EU Battery Regulation", "Battery Regulation", "battery passport"],
    newsQueries: [
      `"EU Battery Regulation"`,
      `"battery passport" EU`,
      `"Battery Regulation" due diligence`,
      `"EU battery rules"`,
      `"battery regulation" recycling`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "hu", gl: "HU", ceid: "HU:hu", countryKo: "헝가리", languageKo: "헝가리어" },
      { hl: "pl", gl: "PL", ceid: "PL:pl", countryKo: "폴란드", languageKo: "폴란드어" },
      { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
      { hl: "ja", gl: "JP", ceid: "JP:ja", countryKo: "일본", languageKo: "일본어" },
    ],
    falsePositiveKeywords: [
      "rechargeable hair dryer",
      "water flosser",
      "market analysis",
      "forecast",
      "size trends",
      "battery show europe",
    ],
  },
  {
    id: "dpp",
    code: "DPP",
    nameKo: "디지털 제품 여권",
    nameEn: "Digital Product Passport",
    shortDescriptionKo: "디지털 전환·제품",
    category: "디지털 전환·제품",
    status: "단계적 시행",
    newsEnabled: true,
    aliases: ["DPP", "Digital Product Passport"],
    newsQueries: [
      `"Digital Product Passport"`,
      `"DPP" "digital product passport"`,
      `"digital product passport" "ESPR"`,
      `"digital product passport" textile`,
      `"digital product passport" battery`,
    ],
    impactRegions: [
      { hl: "de", gl: "DE", ceid: "DE:de", countryKo: "독일", languageKo: "독일어" },
      { hl: "fr", gl: "FR", ceid: "FR:fr", countryKo: "프랑스", languageKo: "프랑스어" },
      { hl: "it", gl: "IT", ceid: "IT:it", countryKo: "이탈리아", languageKo: "이탈리아어" },
      { hl: "ko", gl: "KR", ceid: "KR:ko", countryKo: "한국", languageKo: "한국어" },
      { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", countryKo: "중국", languageKo: "중국어" },
    ],
    falsePositiveKeywords: [
      "democratic progressive party",
      "taiwan dpp",
      "political party",
      "election",
    ],
  },
];

export const NEWS_ENABLED_REGULATIONS = REGULATION_MASTER.filter(
  (regulation) => regulation.newsEnabled
);

export const REGULATION_BY_ID = Object.fromEntries(
  REGULATION_MASTER.map((regulation) => [regulation.id, regulation])
) as Record<RegulationId, RegulationMaster>;
