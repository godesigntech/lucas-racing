"use client"

import { useSyncExternalStore } from "react"

import type { HelmetConfiguration } from "@/types/configurator"

export interface BasketItem {
  id: string
  slug: string
  name: string
  config: HelmetConfiguration
  quantity: number
}

export const MAX_QUANTITY = 10
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

/** Basket actions. The basket lives in localStorage until checkout. */
export const basket = {
  add(item: Omit<BasketItem, "id" | "quantity">, quantity = 1) {
    const current = getSnapshot()
    const existing = current.find((line) => line.slug === item.slug && sameConfig(line.config, item.config))
    if (existing) {
      basket.setQuantity(existing.id, existing.quantity + quantity)
      return
    }
    write([...current, { ...item, id: crypto.randomUUID(), quantity: Math.min(quantity, MAX_QUANTITY) }])
  },
  setQuantity(id: string, quantity: number) {
    const clamped = Math.max(1, Math.min(MAX_QUANTITY, quantity))
    write(getSnapshot().map((line) => (line.id === id ? { ...line, quantity: clamped } : line)))
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

export function useBasketCount(): number {
  return useBasket().reduce((sum, item) => sum + item.quantity, 0)
}
