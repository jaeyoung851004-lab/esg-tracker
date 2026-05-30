import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllRegulationNews,
  fetchGoogleNewsForRegulation,
  REGULATIONS,
  RegulationId,
  NewsItem,
} from "@/lib/news/googleNews";

export const dynamic = "force-dynamic";

function getPublishedTime(item: NewsItem) {
  const time = new Date(item.publishedAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortNewsByDateDesc(news: NewsItem[]) {
  return [...news].sort((a, b) => {
    const dateDiff = getPublishedTime(b) - getPublishedTime(a);
    if (dateDiff !== 0) return dateDiff;

    return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const regulationId = searchParams.get("regulationId") as RegulationId | null;
  const limit = Number(searchParams.get("limit") || 10);

  try {
    if (regulationId) {
      if (!REGULATIONS[regulationId]) {
        return NextResponse.json(
          { error: "Unknown regulationId" },
          { status: 400 }
        );
      }

      const news = sortNewsByDateDesc(
        await fetchGoogleNewsForRegulation(regulationId, limit)
      );

      return NextResponse.json({
        regulationId,
        regulationName: REGULATIONS[regulationId].name,
        count: news.length,
        news,
      });
    }

    const sections = await fetchAllRegulationNews(limit);

    const allNews = sortNewsByDateDesc(
      sections.flatMap((section) =>
        section.news.map((item) => ({
          ...item,
          regulationId: item.regulationId || section.regulationId,
          regulationName: item.regulationName || section.regulationName,
        }))
      )
    );

    return NextResponse.json({
      sections,
      allNews,
      count: allNews.length,
      sort 기준: "publishedAt desc",
    });
  } catch (error) {
    console.error("News API failed", error);

    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
