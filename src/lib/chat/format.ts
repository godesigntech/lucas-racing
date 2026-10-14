// Chat times render on the server and in the browser, so pin the zone to the
// workshop's to keep both renders identical.
const timeZone = "Europe/London"

const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" })
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
const dayFormat = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long" })
const shortDayFormat = new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short" })

const DAY_MS = 24 * 60 * 60 * 1000

/** "2026-10-14", for grouping messages by calendar day. */
export function chatDayKey(value: string | number): string {
  return dayKeyFormat.format(new Date(value))
}

/** "14:05" */
export function formatChatTime(value: string): string {
  return timeFormat.format(new Date(value))
}

/** "Today", "Yesterday" or "Monday 12 October". */
export function formatChatDay(value: string, now = Date.now()): string {
  const key = chatDayKey(value)
  if (key === chatDayKey(now)) return "Today"
  if (key === chatDayKey(now - DAY_MS)) return "Yesterday"
  return dayFormat.format(new Date(value))
}

/** Inbox timestamp: the time for today, otherwise the date. */
export function formatInboxTime(value: string, now = Date.now()): string {
  return chatDayKey(value) === chatDayKey(now) ? formatChatTime(value) : shortDayFormat.format(new Date(value))
}
