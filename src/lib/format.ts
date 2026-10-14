const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

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
  return gbp.format(amount)
}

/** Starting price for product listings. */
export function formatPrice(amount: number | null): string {
  return amount === null ? "Price on request" : `From ${formatMoney(amount)}`
}

/** "+£25" for option surcharges; empty when free. */
export function formatSurcharge(amount: number | undefined): string {
  return amount ? `+${formatMoney(amount)}` : ""
}

export function formatDate(value: string): string {
  return dateFormat.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}
