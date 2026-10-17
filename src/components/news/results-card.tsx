import { Flag, Trophy } from "lucide-react"

import type { NewsResult } from "@/types/news"

/** The race result attached to a post: position big, then event, circuit, class and driver. */
export function ResultsCard({ result }: { result: NewsResult }) {
  const rows = [
    { label: "Event", value: result.event },
    { label: "Circuit", value: result.circuit },
    { label: "Class", value: result.class },
    { label: "Driver", value: result.driver },
  ].filter((row) => row.value)

  return (
    <aside aria-label="Race result" className="grid overflow-hidden rounded-3xl border border-carbon/10 bg-card sm:grid-cols-[10rem_1fr]">
      <div className="flex flex-col items-center justify-center gap-1 bg-carbon px-6 py-6 text-paper">
        <Trophy className="size-6 text-brand" aria-hidden />
        <p className="font-display text-5xl font-bold uppercase leading-none">{result.position || "—"}</p>
        <p className="eyebrow text-paper/60">Result</p>
      </div>
      <dl className="grid content-center gap-x-6 gap-y-3 p-5 sm:grid-cols-2 sm:p-6">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground">
              {row.label === "Event" && <Flag className="size-3" aria-hidden />}
              {row.label}
            </dt>
            <dd className="mt-0.5 font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
