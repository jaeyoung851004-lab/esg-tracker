import type { NewsFeedResponse } from "@/types/dashboard";

const DEFAULT_BACKEND_BASE_URL =
  process.env.ESG_TRACKER_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ESG_TRACKER_API_BASE_URL ||
  "http://127.0.0.1:8000";

export function buildBackendNewsUrl({
  regulationId,
  limit = 20,
}: {
  regulationId?: string;
  limit?: number;
}) {
  const url = new URL("/api/news", DEFAULT_BACKEND_BASE_URL);
  url.searchParams.set("limit", String(limit));

  if (regulationId) {
    url.searchParams.set("regulation_id", regulationId);
  }

  return url.toString();
}

export async function fetchBackendNews({
  regulationId,
  limit = 20,
}: {
  regulationId?: string;
  limit?: number;
}): Promise<NewsFeedResponse> {
  const response = await fetch(buildBackendNewsUrl({ regulationId, limit }), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend news fetch failed: ${response.status}`);
  }

  return response.json();
}

export function emptyNewsFeed(regulationId?: string): NewsFeedResponse {
  return {
    items: [],
    count: 0,
    lookbackDays: 30,
    generatedAt: new Date().toISOString(),
    regulationId: regulationId ?? null,
    availableRegulations: [],
    regionCounts: [],
    reactionTypeCounts: [],
    actorTypeCounts: [],
    sourceTypeCounts: [],
    topSources: [],
  };
}
