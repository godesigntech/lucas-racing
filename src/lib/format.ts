const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

export function formatPrice(amount: number | null): string {
  return amount === null ? "Price on request" : `From ${gbp.format(amount)}`
}
