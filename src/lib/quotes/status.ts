import { toneClasses } from "@/lib/orders/status"
import type { QuoteStatus } from "@/types/design-assistant"

export const quoteStatusMeta: Record<QuoteStatus, { label: string; tone: keyof typeof toneClasses; description: string }> = {
  new: { label: "New", tone: "warning", description: "Waiting for the workshop to get in touch." },
  contacted: { label: "Contacted", tone: "info", description: "We've replied and are talking it through." },
  quoted: { label: "Quoted", tone: "progress", description: "A price and proof have been sent." },
  won: { label: "Won", tone: "success", description: "The customer went ahead." },
  lost: { label: "Closed", tone: "neutral", description: "Didn't go ahead." },
}
