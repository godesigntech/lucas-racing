"use client"

import { useSyncExternalStore } from "react"

import type { ConfigSummaryLine, HelmetConfiguration } from "@/types/configurator"

/**
 * The design a customer sketches in the 3D builder on the own-helmet page, shared with the
 * request form below it (they're separate parts of the page). "touched" is whether they've
 * changed anything, so an untouched default template isn't sent as their idea.
 */
export interface DesignReference {
  slug: string
  name: string
  config: HelmetConfiguration
  summary: Pick<ConfigSummaryLine, "key" | "label" | "value">[]
}

interface State {
  design: DesignReference | null
  touched: boolean
}

let state: State = { design: null, touched: false }
let first: string | null = null
const listeners = new Set<() => void>()

export function setDesignReference(design: DesignReference) {
  const key = JSON.stringify({ slug: design.slug, config: design.config })
  if (first === null) first = key
  state = { design, touched: state.touched || key !== first }
  listeners.forEach((listener) => listener())
}

export function resetDesignReference() {
  state = { design: null, touched: false }
  first = null
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const empty: State = { design: null, touched: false }

export function useDesignReference(): State {
  return useSyncExternalStore(subscribe, () => state, () => empty)
}

/** Where the own-helmet page's request form starts, and where its 3D sketch is. */
export const OWN_HELMET_FORM_ID = "own-helmet-form"
export const DESIGN_SKETCH_ID = "design-sketch"

/** The 3D views sent with the design, in this order. */
export const DESIGN_VIEWS = ["angle", "front", "side", "back"] as const
export const designViewLabels: Record<(typeof DESIGN_VIEWS)[number], string> = { angle: "Three-quarter", front: "Front", side: "Side", back: "Back" }
