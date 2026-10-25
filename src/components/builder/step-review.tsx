"use client"

import { Pencil } from "lucide-react"

import { formatMoney } from "@/lib/format"
import type { ConfigSummaryLine, PriceBreakdown } from "@/types/configurator"

import type { BuilderStepId } from "./builder-steps"

const stepFor: Record<string, BuilderStepId> = {
  model: "helmet",
  size: "size",
  template: "template",
  base: "parts",
  graphic: "parts",
  accent: "parts",
  finish: "finish",
  trim: "trims",
  eyeportTrim: "trims",
  baseTrim: "trims",
  grille1: "trims",
  grille2: "trims",
  visorScrewLeft: "trims",
  visorScrewRight: "trims",

  spoiler: "trims",
  riderName: "details",
  raceNumber: "details",
  logo: "details",
}

interface StepReviewProps {
  summary: ConfigSummaryLine[]
  price: PriceBreakdown | null
  onEdit: (step: BuilderStepId) => void
}

/** Everything chosen, with a shortcut back to each step, and the price breakdown. */
export function StepReview({ summary, price, onEdit }: StepReviewProps) {
  return (
    <div className="space-y-5">
      <dl className="divide-y divide-carbon/10 rounded-2xl border border-carbon/10">
        {summary.map((line) => (
          <div key={line.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <dt className="shrink-0 text-muted-foreground">{line.label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-right font-medium">
              <span className="truncate">{line.value}</span>
              {stepFor[line.key] && (
                <button
                  type="button"
                  onClick={() => onEdit(stepFor[line.key])}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-carbon"
                  aria-label={`Change ${line.label.toLowerCase()}`}
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {price ? (
        <dl className="space-y-1.5 rounded-2xl bg-paper/70 p-4 text-sm" aria-label="Price breakdown">
          {price.lines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="tabular-nums">{formatMoney(line.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-carbon/10 pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(price.total)}</dd>
          </div>
        </dl>
      ) : (
        <p className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          This design is priced on request. Send it to the workshop and we&apos;ll come back with a proof and a quote.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        No payment today. We email you a digital proof of this exact design; once you approve it, we send a payment link and
        get started.
      </p>
    </div>
  )
}
