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
  confirmed: { label: "Confirmed", tone: "info", description: "Proof approved and payment arranged." },
  in_production: { label: "In production", tone: "progress", description: "Your helmet is being masked, dipped and lacquered." },
  ready: { label: "Ready", tone: "success", description: "Finished and ready for collection or dispatch." },
  shipped: { label: "Shipped", tone: "success", description: "On its way to you." },
  completed: { label: "Completed", tone: "neutral", description: "Delivered. Enjoy your new helmet." },
  cancelled: { label: "Cancelled", tone: "danger", description: "This order was cancelled." },
}

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  unpaid: { label: "Awaiting payment", tone: "warning", description: "We'll send a payment link after you approve your proof." },
  paid: { label: "Paid", tone: "success", description: "Payment received." },
  refunded: { label: "Refunded", tone: "neutral", description: "Payment refunded." },
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
export const orderProgressSteps: OrderStatus[] = ["pending", "confirmed", "in_production", "ready", "completed"]

export function progressIndex(status: OrderStatus): number {
  if (status === "shipped") return orderProgressSteps.indexOf("ready")
  return orderProgressSteps.indexOf(status)
}
