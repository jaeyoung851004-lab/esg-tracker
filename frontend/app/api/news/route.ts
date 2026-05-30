import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllRegulationNews,
  fetchGoogleNewsForRegulation,
  REGULATIONS,
  RegulationId,
} from "@/lib/news/googleNews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const regulationId = searchParams.get("regulationId") as RegulationId | null;
  const limit = Number(searchParams.get("limit") || 5);

  try {
    if (regulationId) {
      if (!REGULATIONS[regulationId]) {
        return NextResponse.json(
          { error: "Unknown regulationId" },
          { status: 400 }
        );
      }

      const news = await fetchGoogleNewsForRegulation(regulationId, limit);

      return NextResponse.json({
        regulationId,
        regulationName: REGULATIONS[regulationId].name,
        count: news.length,
        news,
      });
    }

    const sections = await fetchAllRegulationNews(limit);

    return NextResponse.json({
      sections,
    });
  } catch (error) {
    console.error("News API failed", error);

    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
