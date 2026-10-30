const gbpWhole = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
const gbpPence = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 })

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/** £1,234 or £12.50. */
export function formatMoney(amount: number): string {
  // Whole pounds stay short (£549); anything with pence shows both digits (£19.50, not £19.5).
  return Number.isInteger(amount) ? gbpWhole.format(amount) : gbpPence.format(amount)
}

/** Starting price for product listings; empty when the workshop hasn't priced it. */
export function formatPrice(amount: number | null): string {
  return amount === null ? "" : `From ${formatMoney(amount)}`
}

/** "+£25" for option surcharges; empty when free. */
export function formatSurcharge(amount: number | null | undefined): string {
  return amount ? `+${formatMoney(amount)}` : ""
}

/**
 * What to show against one configurator option: a surcharge, or nothing when it's included.
 * Options the workshop hasn't priced yet show nothing either (callers check for null so they
 * don't call them "Included").
 */
export function formatOptionPrice(amount: number | null | undefined): string {
  if (amount === null) return ""
  return formatSurcharge(amount)
}

/** An option's price label for customers: the surcharge, "Included", or nothing if unpriced. */
export function optionPriceLabel(amount: number | null | undefined): string {
  return amount === null ? "" : formatSurcharge(amount) || "Included"
}

export function formatDate(value: string): string {
  return dateFormat.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}
