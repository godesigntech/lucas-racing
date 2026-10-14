export interface CurrentUser {
  id: string
  email: string
  fullName: string
  isAdmin: boolean
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
  createdAt: string
}

/** Result shape returned by every Server Action. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
