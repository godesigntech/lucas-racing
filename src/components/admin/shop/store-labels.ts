import type { StoreId } from "@/types/shop"

/** Short shop names for admin tables and filters. */
export const storeLabels: Record<StoreId, string> = {
  "ms-kart": "MS Kart",
  teamwear: "Teamwear",
  "hydrokarts-parts": "HydroKarts parts",
  delta: "Delta Racewear",
}

export const storeOptions = (Object.keys(storeLabels) as StoreId[]).map((value) => ({ value, label: storeLabels[value] }))

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}
