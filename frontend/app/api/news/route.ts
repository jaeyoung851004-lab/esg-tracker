/**
 * /api/news
 * GET /api/news?regulationId=cbam&limit=15
 * GET /api/news (전체 글로벌 ESG 뉴스)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleNews } from "@/lib/news/googleNews";
import { getTargetRegions } from "@/lib/news/impactMapper";
import regulationsRaw from "../../../../data/regulations.json";

export const runtime = "nodejs";
export const revalidate = 1800; // 30분

function getRegulations(): any[] {
  if (Array.isArray(regulationsRaw)) return regulationsRaw;
  if ((regulationsRaw as any).regulations) return (regulationsRaw as any).regulations;
  return [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const regulationId = searchParams.get("regulationId");
  const limit = Number(searchParams.get("limit") ?? "15");

  const regulations = getRegulations();

  if (regulationId) {
    // 특정 규제 뉴스
    const reg = regulations.find((r: any) => r.id === regulationId);
    if (!reg) {
      return NextResponse.json({ error: "Regulation not found" }, { status: 404 });
    }

    const criteria = reg.affectedCriteria ?? reg.news?.affectedCriteria ?? {};
    const targetRegions = getTargetRegions(criteria);
    const queries: string[] = reg.news?.search_queries ?? reg.search_queries ?? [];
    const required: string[] = reg.news?.required_keywords ?? reg.required_keywords ?? [];
    const exclude: string[] = reg.news?.exclude_keywords ?? reg.exclude_keywords ?? [];

    const news = await fetchGoogleNews({
      queries,
      targetRegions,
      requiredKeywords: required,
      excludeKeywords: exclude,
      limit,
    });

    return NextResponse.json({ regulationId, count: news.length, news });
  }

  // 전체 ESG 뉴스 (대시보드용)
  const globalQueries = [
    "ESG regulation 2026 EU compliance",
    "CSRD CSDDD CBAM update 2026",
    "sustainability reporting directive 2026",
    "EU green deal regulation news",
  ];
  const globalRegions = getTargetRegions({
    coreMarket: ["EU", "US", "KR"],
    sectors: ["financial", "automotive", "electronics"],
    tradeExposure: true,
  });

  const news = await fetchGoogleNews({
    queries: globalQueries,
    targetRegions: globalRegions,
    requiredKeywords: ["ESG","regulation","directive","CSRD","CSDDD","CBAM","sustainability","disclosure"],
    excludeKeywords: ["stock price","earnings","quarterly results","share price"],
    limit,
  });

  return NextResponse.json({ count: news.length, news });
}
