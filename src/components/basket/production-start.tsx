"use client"

import { CalendarDays } from "lucide-react"

import { formatWeek, ukToday, weekStart } from "@/lib/dates/uk"

/**
 * When a helmet can go into the workshop, shown in the basket. The soonest week comes
 * from the production calendar, so it moves on by itself as weeks fill or reopen (e.g.
 * "fully booked for the rest of 2026" makes it January 2027). With `onChange` the customer
 * can also pick a preferred week, which goes in their quote request.
 */
export function ProductionStart({ weeks, value, onChange }: {
  /** Bookable start weeks (Mondays, YYYY-MM-DD), soonest first. */
  weeks: string[]
  value: string
  onChange?: (week: string) => void
}) {
  if (weeks.length === 0) {
    return (
      <p className="rounded-2xl bg-white/5 p-4 text-sm text-paper/80 ring-1 ring-white/10">
        Every week we can see is full at the moment. Send your request anyway and we&apos;ll reply with the soonest date.
      </p>
    )
  }

  const soonest = weeks[0]
  const thisYear = ukToday().slice(0, 4)
  const nextYear = soonest.slice(0, 4) > thisYear
  // More than four weeks out counts as "booked up", so the notice explains the wait.
  const waitWeeks = Math.round((Date.parse(soonest) - Date.parse(weekStart(ukToday()))) / (7 * 86_400_000))

  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="flex items-start gap-2 text-sm">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <span>
          {nextYear
            ? `We're fully booked for the rest of ${thisYear}. `
            : waitWeeks > 4
              ? "We're busy at the moment. "
              : ""}
          The soonest your helmet can go into the workshop is the week of{" "}
          <strong className="font-semibold text-paper">{formatWeek(soonest)}</strong>.
        </span>
      </p>
      {onChange && (
        <label className="block space-y-1.5 text-sm">
          <span className="text-paper/70">Preferred start week</span>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-carbon px-3 text-sm text-paper outline-none focus-visible:ring-3 focus-visible:ring-brand/50"
          >
            {weeks.map((week, index) => (
              <option key={week} value={week}>
                {formatWeek(week)}
                {index === 0 ? " (soonest)" : ""}
              </option>
            ))}
          </select>
          <span className="block text-xs text-paper/55">We confirm the exact dates with your proof.</span>
        </label>
      )}
    </div>
  )
}
