/**
 * How many rows have each status, counted by the database (one exact count per status).
 * Downloading every row's status instead stops at Supabase's 1,000-row limit.
 *
 *   countStatuses(quoteStatuses, (status) => supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", status))
 */
export async function countStatuses<S extends string>(
  statuses: readonly S[],
  count: (status: S) => PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<Record<S, number>> {
  const results = await Promise.all(statuses.map((status) => count(status)))
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
  return Object.fromEntries(statuses.map((status, index) => [status, results[index].count ?? 0])) as Record<S, number>
}
