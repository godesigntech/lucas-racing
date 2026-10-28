import "server-only"

/**
 * The 16-step tables arrive with the 20261018* migrations. Until those have been applied
 * the reads for them fail, and we'd rather the site carry on with what it has than show
 * an error page. Loaders use this to tell "the migration hasn't run" apart from a real
 * database problem, which must still be thrown.
 */

export const MIGRATION_NOTICE =
  "These tables aren't in the database yet. Run `npm run db:migrate` to add them, then reload this page."

export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  return (
    error.code === "42P01" || // Postgres: undefined_table
    error.code === "PGRST205" || // PostgREST: not in the schema cache
    error.code === "PGRST202" || // PostgREST: function not found
    /does not exist|schema cache/i.test(error.message ?? "")
  )
}
