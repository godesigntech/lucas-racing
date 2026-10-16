import type { HelmetLook } from "@/types/helmet"

export const orderStatuses = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "completed",
  "cancelled",
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const paymentStatuses = ["unpaid", "paid", "refunded"] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export interface ShippingAddress {
  line1: string
  line2: string
  city: string
  county: string
  postcode: string
  country: string
}

export interface OrderSummaryLine {
  label: string
  value: string
}

export interface OrderItem {
  id: string
  /** A custom helmet build, or a shop product (MS Kart part, teamwear…). */
  kind: "helmet" | "product"
  /** Which shop a product came from; null for helmets. */
  storeId: string | null
  /** Product photo at the time of ordering; null for helmets (drawn from look). */
  imageUrl: string | null
  productSlug: string
  productName: string
  /** The build as it was ordered (older orders use the earlier, single-film format). */
  values: Record<string, string | undefined>
  summary: OrderSummaryLine[]
  look: HelmetLook | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderEvent {
  id: number
  status: OrderStatus
  paymentStatus: PaymentStatus | null
  note: string
  createdAt: string
}

export interface OrderListItem {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  customerName: string
  customerEmail: string
  total: number
  itemCount: number
  createdAt: string
}

export interface Order extends OrderListItem {
  userId: string | null
  customerPhone: string
  shippingAddress: ShippingAddress
  deliveryMethod: string
  deliveryLabel: string
  deliveryPrice: number
  subtotal: number
  customerNotes: string
  adminNotes: string
  updatedAt: string
  items: OrderItem[]
  events: OrderEvent[]
}
