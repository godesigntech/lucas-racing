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
  /** The public vote (on Facebook). */
  votingOpensAt: string | null
  votingClosesAt: string | null
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
  /** The entrant's story sharing the design. */
  postUrl: string
  ukResident: boolean
  /** A picture of the design (design-uploads), for the anonymous vote. */
  imagePath: string | null
  /** 2nd to 5th in the vote; the winner is the entry with status "winner". */
  place: number | null
  createdAt: string
  updatedAt: string
}

/** A percentage off one custom helmet finish, single use, for one customer. */
export interface Voucher {
  id: string
  code: string
  percentOff: number
  description: string
  expiresAt: string
  redeemedAt: string | null
  /** Past its use-by date when it was loaded. */
  expired: boolean
}

/** The current competition, as the builder needs it to offer "Enter the competition". */
export interface BuilderCompetition {
  id: string
  title: string
  closesAt: string | null
  status: CompetitionStatus
  /** Open, and between its opening and closing times. */
  accepting: boolean
  /** Not taking entries yet: coming soon, or open with an opening time still ahead. */
  opensLater: boolean
}
