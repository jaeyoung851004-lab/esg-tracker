import { NextRequest, NextResponse } from "next/server";
import { buildBackendNewsUrl, emptyNewsFeed } from "@/lib/news/googleNews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 20);
  const regulationId =
    searchParams.get("regulation_id") || searchParams.get("regulationId") || undefined;

  try {
    const response = await fetch(
      buildBackendNewsUrl({ regulationId, limit }),
      { cache: "no-store" }
    );

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("News API proxy failed", error);
    return NextResponse.json(emptyNewsFeed(regulationId), { status: 200 });
  }
}
