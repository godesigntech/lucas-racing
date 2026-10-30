"use client"

import { Pencil } from "lucide-react"

import { formatMoney } from "@/lib/format"
import type { ConfigSummaryLine, PriceBreakdown } from "@/types/configurator"

import type { BuilderStepId } from "./builder-steps"

/** Which step a summary line came from, so "change this" goes to the right place. */
const stepFor: Record<string, BuilderStepId> = {
  model: "helmet",
  size: "helmet",
  route: "helmet",
  template: "template",
  base: "colours",
  graphic: "colours",
  accent: "pinstripes",
  finish: "finish",
  aero: "aero",
  trim: "exterior",
  eyeportTrim: "exterior",
  baseTrim: "exterior",
  grille1: "exterior",
  grille2: "exterior",
  visorScrewLeft: "exterior",
  visorScrewRight: "exterior",

  spoiler: "aero",
  visor: "visor",
  visorStrip: "visorStrip",
  riderName: "details",
  raceNumber: "details",
  personalisation: "details",
  logo: "logos",
  logos: "logos",
}

/** Repeatable lines carry an index ("logos-1"); they still edit the same step. */
function stepForLine(key: string): BuilderStepId | undefined {
  return stepFor[key] ?? stepFor[key.replace(/-\d+$/, "")]
}

interface StepReviewProps {
  summary: ConfigSummaryLine[]
  price: PriceBreakdown | null
  onEdit: (step: BuilderStepId) => void
  /** Choices the workshop hasn't priced yet. While there are any, we can't take the order. */
  pending?: { key: string; label: string }[]
}

/** Everything chosen, with a shortcut back to each step, and the price breakdown. */
export function StepReview({ summary, price, onEdit, pending = [] }: StepReviewProps) {
  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">
            {pending.length === 1 ? "One choice needs a price before you can order" : `${pending.length} choices need a price before you can order`}
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {pending.map((item) => (
              <li key={item.key}>{item.label}</li>
            ))}
          </ul>
          <p className="mt-2">
            Send us your design and we&apos;ll confirm the cost, usually the same day. You can also swap these for a
            priced option and order straight away.
          </p>
        </div>
      )}
      <dl className="divide-y divide-carbon/10 rounded-2xl border border-carbon/10">
        {summary.map((line) => (
          <div key={line.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <dt className="shrink-0 text-muted-foreground">{line.label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-right font-medium">
              <span className="truncate">{line.value}</span>
              {stepForLine(line.key) && (
                <button
                  type="button"
                  onClick={() => onEdit(stepForLine(line.key)!)}
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
            <dt>{pending.length > 0 ? "Priced so far" : "Total"}</dt>
            <dd className="tabular-nums">{formatMoney(price.total)}</dd>
          </div>
          {pending.length > 0 && (
            <p className="pt-1 text-xs font-normal text-muted-foreground">
              This doesn&apos;t include the {pending.length === 1 ? "choice" : "choices"} above, which we&apos;ll price
              for you.
            </p>
          )}
        </dl>
      ) : (
        <p className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          Send this design to the workshop and we&apos;ll come back with a proof and a quote.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        No payment today. We email you a digital proof of this exact design; once you approve it, we send a payment link and
        get started.
      </p>
    </div>
  )
}
