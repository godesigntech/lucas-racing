"use client"

import type { PriceBook } from "@/types/catalog"
import type { CatalogProduct } from "@/types/product"

import { isProductItem, useBasket, useBasketLoaded } from "./basket-store"
import { basketSubtotal, resolveBasketLine, type ResolvedBasketLine } from "./resolve-basket"
import { useLiveVariants } from "./use-live-variants"

/**
 * The basket with every line re-priced: helmets against the catalogue passed in,
 * products against live prices and stock. `loaded` is false until both are known.
 */
export function useResolvedBasket(products: CatalogProduct[], priceBook: PriceBook) {
  const items = useBasket()
  const basketLoaded = useBasketLoaded()
  const { variants, loaded: variantsLoaded } = useLiveVariants(
    items.filter(isProductItem).map((item) => item.variantId),
  )

  const lines: ResolvedBasketLine[] = items.map((item) => resolveBasketLine(item, { products, priceBook, variants }))
  return {
    items,
    lines,
    subtotal: basketSubtotal(lines),
    loaded: basketLoaded && variantsLoaded,
  }
}
