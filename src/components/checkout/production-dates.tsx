"use client"

import { CalendarDays, Check, Zap } from "lucide-react"

import { addWeeks, formatUkDate, formatWeek } from "@/lib/dates/uk"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProductionWeek, RushTier } from "@/types/production"

interface ProductionDatesProps {
  weeks: ProductionWeek[]
  tiers: RushTier[]
  standardLeadWeeks: number
  startDate: string
  rushTier: string
  onChange: (next: { startDate: string; rushTier: string }) => void
  error?: string
}

/**
 * Step 15: when the helmet goes into the workshop, and how quickly it comes out.
 *
 * Only weeks the workshop can actually take are offered — full weeks and shutdowns are
 * shown but can't be chosen, which is more honest than hiding them. The completion date
 * is derived from the chosen week and turnaround, never from the order date.
 *
 * Turnarounds other than standard only appear here when the workshop has switched rush
 * on and given the tier a fee, so provisional pricing is never shown to a customer.
 */
export function ProductionDates({
  weeks,
  tiers,
  standardLeadWeeks,
  startDate,
  rushTier,
  onChange,
  error,
}: ProductionDatesProps) {
  const bookable = weeks.filter((week) => week.isBookable)
  const tier = tiers.find((item) => item.key === rushTier) ?? tiers[0]
  const leadWeeks = tier?.leadWeeks ?? standardLeadWeeks
  const completion = startDate ? addWeeks(startDate, leadWeeks) : null

  if (weeks.length === 0) {
    return (
      <p className="rounded-2xl bg-paddock/50 p-4 text-sm text-muted-foreground">
        We&apos;ll confirm your production dates by email when we send your proof.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {tiers.length > 1 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">How quickly do you need it?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {tiers.map((item) => {
              const selected = tier?.key === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange({ startDate, rushTier: item.key })}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 text-left transition",
                    selected ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
                  )}
                >
                  {item.key !== "standard" && <Zap className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.leadWeeks} {item.leadWeeks === 1 ? "week" : "weeks"} in the workshop
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-brand-ink">
                      {item.fee ? `+${formatMoney(item.fee)}` : "Included"}
                    </span>
                  </span>
                  {selected && <Check className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Which week should we start?</legend>
        {bookable.length === 0 ? (
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            Every week we can see is full. Place your order anyway and we&apos;ll call you with the soonest date.
          </p>
        ) : (
          <ul className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {weeks.map((week) => {
              const selected = week.weekStart === startDate
              const disabled = !week.isBookable
              return (
                <li key={week.weekStart}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ startDate: week.weekStart, rushTier })}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                      selected
                        ? "border-brand-ink bg-brand-ink text-white"
                        : disabled
                          ? "cursor-not-allowed border-carbon/10 text-muted-foreground opacity-60"
                          : "border-carbon/15 hover:border-carbon/35",
                    )}
                  >
                    <CalendarDays className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{formatWeek(week.weekStart)}</span>
                      <span className={cn("block text-xs", selected ? "text-white/70" : "text-muted-foreground")}>
                        {week.isBlackedOut
                          ? "Workshop closed"
                          : week.available <= 0
                            ? "Fully booked"
                            : `${week.available} ${week.available === 1 ? "place" : "places"} left`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </fieldset>

      {startDate && completion && (
        <div className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <p className="font-semibold">Estimated completion: {formatUkDate(completion)}</p>
          <p className="mt-0.5">
            Starting the week of {formatWeek(startDate)}, {leadWeeks} {leadWeeks === 1 ? "week" : "weeks"} in the
            workshop. We confirm the exact date with your proof.
          </p>
        </div>
      )}
    </div>
  )
}
