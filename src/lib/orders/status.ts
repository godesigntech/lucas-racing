import type { OrderStatus, PaymentStatus } from "@/types/order"

type Tone = "neutral" | "info" | "progress" | "success" | "danger" | "warning"

interface StatusMeta {
  label: string
  tone: Tone
  /** What the status means, written for customers. */
  description: string
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  pending: { label: "Received", tone: "warning", description: "We've got your order and will send your proof soon." },
  awaiting_design_review: { label: "In design review", tone: "info", description: "Our workshop is checking your design and artwork." },
  awaiting_proof_approval: { label: "Proof sent", tone: "warning", description: "Your proof is ready. Approve it and we'll book it in." },
  approved_for_production: { label: "Proof approved", tone: "info", description: "Thanks — your helmet is cleared for production." },
  scheduled: { label: "Scheduled", tone: "info", description: "Booked in. Work starts on your production date." },
  confirmed: { label: "Confirmed", tone: "info", description: "Proof approved and payment arranged." },
  in_production: { label: "In production", tone: "progress", description: "Your helmet is being masked, dipped and lacquered." },
  quality_check: { label: "Quality inspection", tone: "progress", description: "Final checks before we sign it off." },
  ready: { label: "Ready", tone: "success", description: "Finished and ready for collection or dispatch." },
  shipped: { label: "Dispatched", tone: "success", description: "On its way to you." },
  completed: { label: "Completed", tone: "neutral", description: "Delivered. Enjoy your new helmet." },
  cancelled: { label: "Cancelled", tone: "danger", description: "This order was cancelled." },
}

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  unpaid: { label: "Awaiting payment", tone: "warning", description: "We'll send a payment link after you approve your proof." },
  paid: { label: "Paid", tone: "success", description: "Payment received." },
  refunded: { label: "Refunded", tone: "neutral", description: "Payment refunded." },
}

// Orders without a custom helmet have no proof to approve: they use this wording instead.
const productStatusText: Partial<Record<OrderStatus, string>> = {
  pending: "We've got your order and will be in touch to confirm it.",
  confirmed: "Order confirmed and payment arranged.",
  in_production: "Your order is being picked and prepared.",
  quality_check: "We're checking your order before it goes out.",
  scheduled: "Your order is booked in.",
}
const productPaymentText: Partial<Record<PaymentStatus, string>> = {
  unpaid: "We'll send a secure payment link once we've confirmed your order.",
}

/** What a status means for this order (helmet orders mention the proof). */
export function statusDescription(status: OrderStatus, hasHelmets: boolean): string {
  return (!hasHelmets && productStatusText[status]) || orderStatusMeta[status].description
}

export function paymentDescription(status: PaymentStatus, hasHelmets: boolean): string {
  return (!hasHelmets && productPaymentText[status]) || paymentStatusMeta[status].description
}

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-carbon/8 text-carbon ring-carbon/15",
  info: "bg-sky-100 text-sky-900 ring-sky-300/60",
  progress: "bg-violet-100 text-violet-900 ring-violet-300/60",
  success: "bg-accent text-brand-ink ring-brand-ink/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  warning: "bg-amber-100 text-amber-900 ring-amber-300/60",
}

/** The happy path a customer sees as a progress tracker. */
export const orderProgressSteps: OrderStatus[] = [
  "pending",
  "awaiting_proof_approval",
  "approved_for_production",
  "in_production",
  "ready",
  "completed",
]

/** Statuses that sit at the same point of the tracker as one of the steps above. */
const progressAliases: Partial<Record<OrderStatus, OrderStatus>> = {
  awaiting_design_review: "pending",
  scheduled: "approved_for_production",
  confirmed: "approved_for_production",
  quality_check: "in_production",
  shipped: "ready",
}

export function progressIndex(status: OrderStatus): number {
  return orderProgressSteps.indexOf(progressAliases[status] ?? status)
}
