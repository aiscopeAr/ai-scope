/**
 * lib/social/performance.ts
 *
 * Pure computation of the Telegram performance summary from SocialPost rows
 * already in the database — no new metrics are invented, no external
 * analytics call happens here. Kept separate from the API route so the
 * math (success rate, retry rate, "most recent" picks) can be unit-tested
 * without a live database.
 */

export interface SocialPostSummaryRow {
  status: string;
  createdAt: Date;
  sentAt: Date | null;
  errorMsg: string | null;
  nextAttemptAt: Date | null;
}

export interface TelegramPerformanceSummary {
  drafted: number;
  sent: number;
  failed: number;
  awaitingRetry: number;
  sending: number;
  successRate: number | null; // null when there's no completed (sent+failed) volume to rate
  retryRate: number | null; // fraction of sent+failed+awaitingRetry attempts that involved at least one retry
  mostRecentSuccess: { sentAt: Date } | null;
  mostRecentFailure: { errorMsg: string | null; createdAt: Date } | null;
}

/**
 * "Awaiting retry" is an approved post with attemptCount > 0 (it already
 * failed at least once and is scheduled for another attempt) — distinct
 * from a fresh "approved" post that hasn't been attempted yet, which just
 * counts toward "drafted" until its first attempt.
 */
export interface SocialPostForSummary extends SocialPostSummaryRow {
  attemptCount: number;
}

export function computeTelegramPerformanceSummary(rows: SocialPostForSummary[]): TelegramPerformanceSummary {
  const drafted = rows.length;
  const sentRows = rows.filter((r) => r.status === "sent");
  const failedRows = rows.filter((r) => r.status === "failed");
  const sendingRows = rows.filter((r) => r.status === "sending");
  const awaitingRetryRows = rows.filter((r) => r.status === "approved" && r.attemptCount > 0);

  const completedVolume = sentRows.length + failedRows.length;
  const successRate = completedVolume > 0 ? sentRows.length / completedVolume : null;

  const retriedVolume = sentRows.length + failedRows.length + awaitingRetryRows.length;
  const retriedCount = rows.filter((r) => r.attemptCount > 1 || (r.status !== "sent" && r.attemptCount > 0)).length;
  const retryRate = retriedVolume > 0 ? retriedCount / retriedVolume : null;

  const mostRecentSuccess = sentRows
    .filter((r): r is SocialPostForSummary & { sentAt: Date } => r.sentAt !== null)
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0] ?? null;

  const mostRecentFailure = failedRows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

  return {
    drafted,
    sent: sentRows.length,
    failed: failedRows.length,
    awaitingRetry: awaitingRetryRows.length,
    sending: sendingRows.length,
    successRate,
    retryRate,
    mostRecentSuccess: mostRecentSuccess ? { sentAt: mostRecentSuccess.sentAt } : null,
    mostRecentFailure: mostRecentFailure ? { errorMsg: mostRecentFailure.errorMsg, createdAt: mostRecentFailure.createdAt } : null,
  };
}
