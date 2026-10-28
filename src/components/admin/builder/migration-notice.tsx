import { TriangleAlert } from "lucide-react"

/**
 * Shown when the 16-step tables aren't in the database yet. The site keeps working
 * without them — the builder falls back to its original three design areas — so this
 * explains the state rather than looking like a failure.
 */
export function MigrationNotice({ area }: { area: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="space-y-2">
        <p className="font-semibold">{area} isn&apos;t set up in the database yet</p>
        <p>
          The tables for this arrive with the latest migrations. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">npm run db:migrate</code> and reload
          this page.
        </p>
        <p>
          Until then the helmet builder carries on with the design areas it has always had, and customers see standard
          production only.
        </p>
      </div>
    </div>
  )
}
