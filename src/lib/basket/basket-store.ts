"use client"

import { useSyncExternalStore } from "react"

import type { HelmetConfiguration } from "@/types/configurator"
import type { StoreId } from "@/types/shop"

/** A custom helmet build. Lines saved before shop products existed have no `kind`. */
export interface HelmetBasketItem {
  kind?: "helmet"
  id: string
  slug: string
  name: string
  config: HelmetConfiguration
  quantity: number
}

/** A shop product (MS Kart part, teamwear…), identified by the exact variant bought. */
export interface ProductBasketItem {
  kind: "product"
  id: string
  variantId: string
  productSlug: string
  storeId: StoreId
  /** Shown while prices and stock are re-checked; the live values win. */
  name: string
  variantLabel: string
  imageUrl: string | null
  quantity: number
}

export type BasketItem = HelmetBasketItem | ProductBasketItem

export function isProductItem(item: BasketItem): item is ProductBasketItem {
  return item.kind === "product"
}

/** Per-line limits: helmets are made to order; products are limited by stock too. */
export const MAX_QUANTITY = 10
export const MAX_PRODUCT_QUANTITY = 99

const STORAGE_KEY = "lucas-racing:basket:v1"
const EMPTY: BasketItem[] = []

let items: BasketItem[] | null = null
const listeners = new Set<() => void>()

function read(): BasketItem[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? (parsed as BasketItem[]) : []
  } catch {
    return []
  }
}

function write(next: BasketItem[]) {
  items = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be unavailable (private mode); the basket still works for this visit.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    items = read()
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function getSnapshot() {
  if (items === null) items = read()
  return items
}

const sameConfig = (a: HelmetConfiguration, b: HelmetConfiguration) => JSON.stringify(a) === JSON.stringify(b)

function limitFor(item: BasketItem) {
  return isProductItem(item) ? MAX_PRODUCT_QUANTITY : MAX_QUANTITY
}

/** Basket actions. The basket lives in localStorage until checkout. */
export const basket = {
  /** Adds a helmet build, or adds to the quantity of an identical one. */
  add(item: Omit<HelmetBasketItem, "id" | "quantity" | "kind">, quantity = 1) {
    const current = getSnapshot()
    const existing = current.find(
      (line): line is HelmetBasketItem => !isProductItem(line) && line.slug === item.slug && sameConfig(line.config, item.config),
    )
    if (existing) {
      basket.setQuantity(existing.id, existing.quantity + quantity)
      return
    }
    write([...current, { ...item, kind: "helmet", id: crypto.randomUUID(), quantity: Math.min(quantity, MAX_QUANTITY) }])
  },
  /** Adds a product variant, or adds to its quantity. `max` caps it at what's in stock. */
  addProduct(item: Omit<ProductBasketItem, "id" | "quantity" | "kind">, quantity = 1, max = MAX_PRODUCT_QUANTITY) {
    const current = getSnapshot()
    const limit = Math.min(max, MAX_PRODUCT_QUANTITY)
    const existing = current.find(
      (line): line is ProductBasketItem => isProductItem(line) && line.variantId === item.variantId,
    )
    if (existing) {
      write(current.map((line) => (line.id === existing.id ? { ...existing, ...item, quantity: Math.min(limit, existing.quantity + quantity) } : line)))
      return
    }
    write([...current, { ...item, kind: "product", id: crypto.randomUUID(), quantity: Math.max(1, Math.min(quantity, limit)) }])
  },
  setQuantity(id: string, quantity: number) {
    write(
      getSnapshot().map((line) =>
        line.id === id ? { ...line, quantity: Math.max(1, Math.min(limitFor(line), quantity)) } : line,
      ),
    )
  },
  remove(id: string) {
    write(getSnapshot().filter((line) => line.id !== id))
  },
  clear() {
    write([])
  },
}

export function useBasket(): BasketItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}

const noSubscription = () => () => {}

/**
 * False on the server and during hydration, when the basket (in localStorage) isn't
 * known yet. Pages use it to show a loading state instead of flashing "empty".
 */
export function useBasketLoaded(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false)
}

export function useBasketCount(): number {
  return useBasket().reduce((sum, item) => sum + item.quantity, 0)
}
