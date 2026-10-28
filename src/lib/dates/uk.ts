/**
 * UK dates, in one place.
 *
 * Production is scheduled in whole weeks starting Monday, Europe/London. The rest of the
 * app formats dates with `Intl` but without a time zone, which is fine for an order's
 * timestamp and wrong for a production date: near midnight the server and the customer
 * would disagree about which day it is. Everything here pins the zone explicitly.
 */

export const UK_TIME_ZONE = "Europe/London"

// en-CA gives a sortable YYYY-MM-DD, which is also the shape Postgres `date` columns use.
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const longFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

const shortFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** Today in London, as YYYY-MM-DD. */
export function ukToday(): string {
  return dayKeyFormat.format(new Date())
}

/** A Date (or now) as a London YYYY-MM-DD day key. */
export function ukDayKey(value: Date = new Date()): string {
  return dayKeyFormat.format(value)
}

/** "Monday, 16 November 2026" for a YYYY-MM-DD day key. */
export function formatUkDate(dayKey: string): string {
  return longFormat.format(parseDayKey(dayKey))
}

/** "16 Nov 2026" for a YYYY-MM-DD day key. */
export function formatUkDateShort(dayKey: string): string {
  return shortFormat.format(parseDayKey(dayKey))
}

/**
 * A day key as a Date at midday UTC. Midday, not midnight, so that shifting by whole
 * days can't slip across a date boundary when British Summer Time starts or ends.
 */
export function parseDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number)
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 12))
}

/** Day key `days` after (or before) another one. */
export function addDays(dayKey: string, days: number): string {
  const date = parseDayKey(dayKey)
  date.setUTCDate(date.getUTCDate() + days)
  return ukDayKey(date)
}

export function addWeeks(dayKey: string, weeks: number): string {
  return addDays(dayKey, weeks * 7)
}

/** The Monday of the week a day key falls in — the unit production is booked by. */
export function weekStart(dayKey: string): string {
  const date = parseDayKey(dayKey)
  // getUTCDay: 0 is Sunday, so Sunday is six days after its Monday.
  const weekday = (date.getUTCDay() + 6) % 7
  return addDays(dayKey, -weekday)
}

/** "16–22 Nov 2026", the way the workshop talks about a production week. */
export function formatWeek(mondayKey: string): string {
  const sunday = addDays(mondayKey, 6)
  const start = parseDayKey(mondayKey)
  const end = parseDayKey(sunday)
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
  const startPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" }),
  }).format(start)
  return `${startPart}–${shortFormat.format(end)}`
}

/** Whole days between two day keys (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86_400_000)
}
