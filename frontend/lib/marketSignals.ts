import marketSignalsData from "@/data/market_signals.json";

export type PlayerType =
  | "company"
  | "government"
  | "regulator"
  | "industry_association"
  | "NGO"
  | "investor";

export type ActionType =
  | "partnership"
  | "investment"
  | "pilot"
  | "guidance"
  | "lobbying"
  | "policy"
  | "compliance"
  | "supply_chain"
  | "technology"
  | "legal";

export type SignalStance = "support" | "critical" | "neutral" | "mixed";
export type ReviewStatus = "approved" | "pending";

export type MarketSignal = {
  signal_id: string;
  reg_id: string;
  regulation_name: string;
  published_date: string;
  source_name: string;
  source_url: string;
  article_title: string;
  player: string;
  player_type: PlayerType;
  action_type: ActionType;
  signal_summary: string;
  stance: SignalStance;
  country: string;
  review_status: ReviewStatus;
};

const marketSignals = marketSignalsData as MarketSignal[];

function sortByPublishedDateDesc(a: MarketSignal, b: MarketSignal) {
  return b.published_date.localeCompare(a.published_date);
}

export function getSignalsByRegId(regId: string) {
  const normalizedRegId = regId.toLowerCase();

  return marketSignals
    .filter((signal) => signal.reg_id.toLowerCase() === normalizedRegId)
    .sort(sortByPublishedDateDesc);
}

export function getRecentSignals(days: number) {
  const latestPublishedTime = Math.max(
    ...marketSignals.map((signal) => new Date(`${signal.published_date}T00:00:00`).getTime())
  );
  const cutoff = new Date(latestPublishedTime);
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  return marketSignals
    .filter((signal) => {
      const publishedAt = new Date(`${signal.published_date}T00:00:00`);
      return publishedAt >= cutoff;
    })
    .sort(sortByPublishedDateDesc);
}

export function getSignalStats() {
  return {
    totalSignals: marketSignals.length,
    totalRegulations: new Set(marketSignals.map((signal) => signal.reg_id)).size,
    totalPlayers: new Set(marketSignals.map((signal) => signal.player)).size,
  };
}
