/**
 * impactMapper.ts
 * 규제의 affectedCriteria → targetRegions (Google News 로케일) 자동 생성
 */
import countryProfiles from "@/data/countryProfiles.json";

export interface AffectedCriteria {
  coreMarket?: string[];          // 규제 직접 적용 지역 ["EU", "US", "KR"]
  sectors?: string[];             // 영향 산업 ["steel", "battery"]
  supplyChainInputs?: string[];   // 원자재/투입물 ["lithium", "cobalt"]
  tradeExposure?: boolean;        // 글로벌 무역 노출 여부
}

export interface GoogleLocale {
  hl: string;
  gl: string;
  ceid: string;
}

const profiles = countryProfiles as {
  sectors: Record<string, string[]>;
  materials: Record<string, string[]>;
  markets: Record<string, string[]>;
  googleLocales: Record<string, GoogleLocale>;
};

export function getTargetRegions(criteria: AffectedCriteria): GoogleLocale[] {
  const countrySet = new Set<string>();

  // 1. 영어 공통 기본값 (항상 포함)
  ["US", "GB"].forEach((c) => countrySet.add(c));

  // 2. coreMarket 확장
  (criteria.coreMarket ?? []).forEach((market) => {
    const countries = profiles.markets[market] ?? [];
    countries.forEach((c) => countrySet.add(c));
    // market이 직접 국가 코드면 그냥 추가
    if (profiles.googleLocales[market]) countrySet.add(market);
  });

  // 3. 산업별 영향국가
  (criteria.sectors ?? []).forEach((sector) => {
    (profiles.sectors[sector] ?? []).forEach((c) => countrySet.add(c));
  });

  // 4. 원자재/공급망별 영향국가
  (criteria.supplyChainInputs ?? []).forEach((material) => {
    (profiles.materials[material] ?? []).forEach((c) => countrySet.add(c));
  });

  // 5. 글로벌 무역 노출이면 주요 교역국 추가
  if (criteria.tradeExposure) {
    (profiles.markets["global_trade"] ?? []).forEach((c) => countrySet.add(c));
  }

  // 6. Google Locale 매핑 (없는 국가 코드는 제외)
  const locales: GoogleLocale[] = [];
  countrySet.forEach((code) => {
    const locale = profiles.googleLocales[code];
    if (locale) locales.push(locale);
  });

  // 중복 ceid 제거
  const seen = new Set<string>();
  return locales.filter((l) => {
    if (seen.has(l.ceid)) return false;
    seen.add(l.ceid);
    return true;
  });
}
