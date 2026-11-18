import { configToSearchParams } from "@/lib/configurator/helmet-configuration"
import { formatMoney } from "@/lib/format"

import type { AvailableLine } from "./resolve-basket"

/** The contact form takes up to 2,000 characters. */
const LIMIT = 1990

/**
 * The basket as a quote request for the contact form, while checkout is switched off
 * (Admin > Settings > Launches): every item with its price and choices, and a link that
 * opens each helmet exactly as designed.
 */
export function basketQuoteMessage(lines: AvailableLine[], origin: string): string {
  const intro = "Hi, I'd like a quote for the items in my basket:"
  const entries = lines.map((line) => {
    if (line.kind === "helmet") {
      const link = `${origin}/helmet-builder?${configToSearchParams(line.item.config)}`
      return `• ${line.quantity} × ${line.item.name} helmet (${formatMoney(line.unitPrice)} each). Design: ${link}`
    }
    const choices = line.finishSummary.map((row) => `${row.label}: ${row.value}`).join("; ")
    return `• ${line.quantity} × ${line.product.title}${line.variantLabel ? `, ${line.variantLabel}` : ""} (${formatMoney(line.unitPrice)} each)${choices ? `. ${choices}` : ""}`
  })

  let message = intro
  for (const [index, entry] of entries.entries()) {
    const rest = entries.length - index
    if ((message + "\n\n" + entry).length > LIMIT - 40) {
      message += `\n\n…and ${rest} more item${rest === 1 ? "" : "s"} in my basket.`
      break
    }
    message += `\n\n${entry}`
  }
  return message.slice(0, LIMIT)
}
