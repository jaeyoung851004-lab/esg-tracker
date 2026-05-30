import type { DashboardStats, NewsItem, Regulation } from "@/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const fallbackRegulations: Regulation[] = [
  {id:"esrs-e1-6",code:"CSRD",title:"ESRS E1-6 생물다양성 데이터 미수집",category:"공시",country:"EU",industry:"전 산업",status:"대응 필요",statusTone:"danger",deadline:"2026-07-15",dDay:47,readiness:72,risk:"매출의 2%",priority:"높음",summary:"CSRD 적용 기업의 지속가능성 보고 범위와 데이터 수집 체계를 점검해야 합니다."},
  {id:"csddd-supply-chain",code:"CSDDD",title:"공급망 실사 정책 문서화 필요",category:"공급망",country:"EU",industry:"제조/유통",status:"입법 진행",statusTone:"warning",deadline:"2026-10-27",dDay:120,readiness:40,risk:"매출의 5%",priority:"높음",summary:"공급망 인권·환경 실사 정책과 협력사 평가 프로세스 정비가 필요합니다."},
  {id:"scope3-category1",code:"CDP 기후",title:"Scope 3 카테고리 1 데이터 검증 누락",category:"기후",country:"Global",industry:"전 산업",status:"시행 중",statusTone:"success",deadline:"2026-12-31",dDay:218,readiness:65,risk:"—",priority:"중간",summary:"구매 제품·서비스 배출량 산정 근거와 검증 문서를 정리해야 합니다."},
];

const fallbackNews: NewsItem[] = [
  {id:"reuters-csrd-csddd",source:"Reuters",title:"EU Omnibus proposal to simplify CSRD and CSDDD published",age:"2일 전",url:"https://www.reuters.com/"},
  {id:"bloomberg-ifrs-s2",source:"Bloomberg",title:"ISSB unveils new sustainability disclosure standard (IFRS S2)",age:"3일 전",url:"https://www.bloomberg.com/"},
  {id:"ft-sec-climate",source:"Financial Times",title:"SEC delays climate disclosure rule implementation",age:"5일 전",url:"https://www.ft.com/"},
  {id:"euractiv-espr",source:"Euractiv",title:"ESPR delegated acts for textiles expected in 2026",age:"1주 전",url:"https://www.euractiv.com/"},
  {id:"guardian-cbam",source:"The Guardian",title:"EU adopts Carbon Border Adjustment Mechanism (CBAM) phase-in rules",age:"1주 전",url:"https://www.theguardian.com/"},
];

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) return fallback;
    return response.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export async function getRegulations(): Promise<Regulation[]> {
  return getJson<Regulation[]>("/api/regulations", fallbackRegulations);
}

export async function getNews(): Promise<NewsItem[]> {
  return getJson<NewsItem[]>("/api/news", fallbackNews);
}

export async function getStats(): Promise<DashboardStats> {
  const fallback: DashboardStats = {
    totalRegulations: fallbackRegulations.length,
    urgentTasks: fallbackRegulations.filter((item) => item.dDay <= 120).length,
    averageReadiness: Math.round(fallbackRegulations.reduce((sum, item) => sum + item.readiness, 0) / fallbackRegulations.length),
    highPriority: fallbackRegulations.filter((item) => item.priority === "높음").length,
  };
  return getJson<DashboardStats>("/api/dashboard/stats", fallback);
}
