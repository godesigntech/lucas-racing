export const enquiryStatuses = ["new", "replied", "closed"] as const
export type EnquiryStatus = (typeof enquiryStatuses)[number]

/** A message sent through the contact form. */
export interface Enquiry {
  id: string
  /** Set when the sender was signed in. */
  userId: string | null
  name: string
  email: string
  phone: string
  topic: string
  /** Product slug they asked about, if any. */
  design: string
  message: string
  status: EnquiryStatus
  adminNotes: string
  createdAt: string
}
