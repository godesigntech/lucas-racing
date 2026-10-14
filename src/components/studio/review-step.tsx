import { Pencil } from "lucide-react"

import { formatMoney } from "@/lib/format"
import type { ConfigKey, ConfigSummaryLine, PriceBreakdown } from "@/types/configurator"

import { studioSteps, type StudioStepId } from "./studio-steps"

interface ReviewStepProps {
  summary: ConfigSummaryLine[]
  price: PriceBreakdown | null
  onEdit: (step: StudioStepId) => void
}

function stepFor(key: ConfigKey): StudioStepId {
  return studioSteps.find((step) => step.groups.includes(key))?.id ?? "helmet"
}

/** Everything the customer chose, with quick links back to each step and the price breakdown. */
export function ReviewStep({ summary, price, onEdit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <dl className="divide-y divide-carbon/10 rounded-2xl border border-carbon/10">
        {summary.map((line) => (
          <div key={line.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{line.label}</dt>
            <dd className="flex items-center gap-2 text-right font-medium">
              {line.value}
              <button
                type="button"
                onClick={() => onEdit(stepFor(line.key))}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-carbon"
                aria-label={`Change ${line.label.toLowerCase()}`}
              >
                <Pencil className="size-3.5" />
              </button>
            </dd>
          </div>
        ))}
      </dl>

      {price ? (
        <dl className="space-y-1.5 text-sm" aria-label="Price breakdown">
          {price.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="tabular-nums">{formatMoney(line.amount)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          This design is priced on request. Send it to the workshop and we&apos;ll come back with a proof and a quote.
        </p>
      )}
    </div>
  )
}
