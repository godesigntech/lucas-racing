"use client"

import { createContext, useContext } from "react"

/**
 * True where the builder is only for sketching a design (the own-helmet page): no prices,
 * and no "Included" either. The price book there has its prices taken out as well
 * (withoutPrices), so amounts disappear on their own; this covers the wording around them.
 */
export const PricesHiddenContext = createContext(false)

export function usePricesHidden(): boolean {
  return useContext(PricesHiddenContext)
}
