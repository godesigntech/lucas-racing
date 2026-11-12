"use client"

import { useEffect, useState } from "react"

import { toShopProduct, toShopVariant } from "@/lib/shop/mappers"
import type { ShopProductRow, ShopVariantRow } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/browser"
import type { ShopProduct, ShopVariant } from "@/types/shop"

export interface LiveVariant {
  variant: ShopVariant
  product: ShopProduct
  /** False for browse-only stores (Delta). */
  purchasable: boolean
}

type Row = ShopVariantRow & { shop_products: ShopProductRow & { stores: { purchasable: boolean } } }

/**
 * Current price, stock and availability for the product variants in the basket.
 * Prices and stock can change after something is added, so the basket and checkout
 * always show the live values. Hidden or deleted variants simply don't come back.
 */
export function useLiveVariants(variantIds: string[]): { variants: Map<string, LiveVariant>; loaded: boolean } {
  const key = [...new Set(variantIds)].sort().join(",")
  const [state, setState] = useState<{ key: string; variants: Map<string, LiveVariant> }>({ key: "", variants: new Map() })
  // Bumped to try again after a failed look-up (a dropped connection).
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!key) return
    let cancelled = false
    let retry: number | undefined
    createClient()
      .from("shop_variants")
      .select("*, shop_products!inner(*, stores!inner(purchasable))")
      .in("id", key.split(","))
      .then(({ data, error }) => {
        if (cancelled) return
        // Not "unavailable": we just don't know yet. Stay loading and ask again shortly.
        if (error) {
          retry = window.setTimeout(() => setAttempt((count) => count + 1), Math.min(15000, 2000 * 2 ** Math.min(attempt, 3)))
          return
        }
        const variants = new Map<string, LiveVariant>()
        for (const row of (data ?? []) as unknown as Row[]) {
          variants.set(row.id, {
            variant: toShopVariant(row),
            product: toShopProduct(row.shop_products),
            purchasable: row.shop_products.stores.purchasable,
          })
        }
        setState({ key, variants })
      })
    return () => {
      cancelled = true
      window.clearTimeout(retry)
    }
  }, [key, attempt])

  return { variants: state.key === key ? state.variants : new Map(), loaded: !key || state.key === key }
}
