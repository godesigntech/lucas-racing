/**
 * Production scheduling. The customer chooses when their helmet goes into the workshop,
 * not when they order, so none of this is derived from the order date.
 */
export interface ProductionSettings {
  /** Standard turnaround in whole weeks from the chosen start date. */
  standardLeadWeeks: number
  /** Helmets that may start in one week unless that week has its own capacity. */
  weeklyCapacity: number
  /** The soonest a customer may book, in days from today. */
  bookingLeadDays: number
  /** How far ahead the calendar offers dates. */
  horizonWeeks: number
  /** Master switch. Rush stays off until the client approves the fees. */
  rushEnabled: boolean
}

/**
 * A turnaround the customer can pick. `isDraft` marks the client's provisional rush
 * pricing, which must not be charged until they approve it; `fee` of null means the
 * price is still to be agreed and checkout will refuse it.
 */
export interface RushTier {
  key: string
  label: string
  leadWeeks: number
  fee: number | null
  maxPerWeek: number
  isDraft: boolean
  isActive: boolean
  sortOrder: number
}

/** One week in the production calendar, as customers see it. */
export interface ProductionWeek {
  /** Monday, as YYYY-MM-DD in London. */
  weekStart: string
  slots: number
  booked: number
  available: number
  isBlackedOut: boolean
  isBookable: boolean
}

export interface ProductionBlackout {
  id: string
  startsOn: string
  endsOn: string
  reason: string
}

export interface ProductionBooking {
  id: string
  orderId: string
  startDate: string
  weekStart: string
  rushTier: string
  leadWeeks: number
  completionDate: string
  helmetCount: number
}

/** What the customer picks at step 15 and sends to checkout. */
export interface ProductionChoice {
  startDate: string
  rushTier: string
}

export type ProofKind = "design_proof" | "production_photo"
export type ProofStatus = "pending" | "approved" | "changes_requested"

export interface OrderProof {
  id: string
  orderId: string
  orderItemId: string | null
  kind: ProofKind
  version: number
  /** Path in the private order-proofs bucket; read through a signed URL. */
  imagePath: string
  caption: string
  status: ProofStatus
  customerNote: string
  respondedAt: string | null
  createdAt: string
}
