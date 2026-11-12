import type { Tone } from "@/lib/orders/status"
import type { Competition, CompetitionStatus, EntryStatus } from "@/types/competition"

export const competitionStatusMeta: Record<CompetitionStatus, { label: string; description: string; tone: Tone }> = {
  upcoming: { label: "Coming soon", description: "The page is up; entries aren't open yet.", tone: "neutral" },
  open: { label: "Open for entries", description: "Customers can enter from the builder until the closing date.", tone: "success" },
  closed: { label: "Closed, voting", description: "No more entries. Post the designs on Facebook for the vote (Vote & prizes tab), then record the winner and places.", tone: "warning" },
  judged: { label: "Winner announced", description: "The winner is shown on the competition page.", tone: "info" },
}

export const entryStatusMeta: Record<EntryStatus, { label: string; tone: Tone }> = {
  entered: { label: "Entered", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "progress" },
  winner: { label: "Winner", tone: "success" },
  disqualified: { label: "Disqualified", tone: "danger" },
}

/** True while the competition takes entries: open, and between its opening and closing times. */
export function isAcceptingEntries(competition: Pick<Competition, "status" | "opensAt" | "closesAt">, now = Date.now()): boolean {
  if (competition.status !== "open") return false
  if (competition.opensAt && now < Date.parse(competition.opensAt)) return false
  if (competition.closesAt && now >= Date.parse(competition.closesAt)) return false
  return true
}

/** Not taking entries yet: coming soon, or open with its opening time still ahead. */
export function opensLater(competition: Pick<Competition, "status" | "opensAt">, now = Date.now()): boolean {
  if (competition.status === "upcoming") return true
  return competition.status === "open" && competition.opensAt !== null && now < Date.parse(competition.opensAt)
}

/** "Friday 12 December 2026, 6pm" in UK time. */
export function formatClosing(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    // "11:59 pm", as the rules are written.
    hour12: true,
    timeZone: "Europe/London",
  }).format(new Date(value))
}

/** "12 December 2026" for a yyyy-mm-dd date. */
export function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
}
