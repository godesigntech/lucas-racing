export const competitionStatuses = ["upcoming", "open", "closed", "judged"] as const
export type CompetitionStatus = (typeof competitionStatuses)[number]

export const entryStatuses = ["entered", "shortlisted", "winner", "disqualified"] as const
export type EntryStatus = (typeof entryStatuses)[number]

/** A design competition, as set up by the workshop in admin. */
export interface Competition {
  id: string
  slug: string
  title: string
  prize: string
  description: string
  rules: string[]
  opensAt: string | null
  closesAt: string | null
  /** yyyy-mm-dd */
  judgingDate: string | null
  status: CompetitionStatus
  winnerEntryId: string | null
}

/** What the public page shows about the winner. */
export interface CompetitionWinner {
  firstName: string
  designName: string
  productSlug: string
}

export interface CompetitionEntry {
  id: string
  reference: string
  competitionId: string
  userId: string
  name: string
  email: string
  designName: string
  productSlug: string
  /** The builder configuration, as entered (normalised again before it's shown). */
  config: Record<string, unknown>
  summary: { key: string; label: string; value: string }[]
  status: EntryStatus
  marketingOptIn: boolean
  agreedRulesAt: string
  adminNotes: string
  createdAt: string
  updatedAt: string
}

/** The current competition, as the builder needs it to offer "Enter the competition". */
export interface BuilderCompetition {
  id: string
  title: string
  closesAt: string | null
  status: CompetitionStatus
  /** Open, and between its opening and closing times. */
  accepting: boolean
}
