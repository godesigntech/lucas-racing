/**
 * Staff roles: admins run everything; sales handle orders, customers, messages, quotes and
 * enquiries; teamwear (Wendy) manages Teamwear products and sees Teamwear orders, nothing else.
 */
export type StaffRole = "admin" | "sales" | "teamwear"

export interface CurrentUser {
  id: string
  email: string
  fullName: string
  /** Admin or Sales: the full staff side (orders, customers, messages...). */
  isAdmin: boolean
  /** Any staff role, Teamwear included: can open the admin panel. */
  isStaff: boolean
  /** Staff role, or null for customers. */
  role: StaffRole | null
}

export interface Profile {
  id: string
  email: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
  createdAt: string
}

export interface CustomerSummary {
  id: string
  email: string
  fullName: string
  phone: string
  city: string
  postcode: string
  createdAt: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string | null
}

export interface AdminUser {
  email: string
  role: StaffRole
  createdAt: string
}

/** Result shape returned by every Server Action. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
