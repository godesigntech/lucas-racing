"use client"

import { useState } from "react"
import { bellParts } from "@/lib/helmet-3d/parts"

import {
  calculateHelmetPrice,
  configurationToLook,
  getInitialConfiguration,
  normaliseConfiguration,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

/** Personal details that carry over when the customer switches template. */
const carriedOver = [...bellParts.map(({ key }) => key), "model", "size", "finish", "trim", "spoiler", "riderName", "namePosition", "raceNumber", "numberPosition", "logo", "logoPosition"] as const

/**
 * Builder state: the chosen template (design) and the build on it, kept valid as
 * the customer changes things. Look, price and summary are derived from it.
 */
export function useHelmetConfigurator(products: CatalogProduct[], priceBook: PriceBook, start: { product: CatalogProduct; config?: HelmetConfiguration }) {
  const [product, setProduct] = useState(start.product)
  const [config, setConfig] = useState<HelmetConfiguration>(() =>
    start.config ? normaliseConfiguration(start.config, start.product, priceBook) : getInitialConfiguration(start.product, priceBook),
  )

  /** Change any fields; the result is re-validated (e.g. a size the new helmet doesn't come in). */
  const update = (changes: Partial<HelmetConfiguration>) => {
    setConfig((current) => normaliseConfiguration({ ...current, ...changes }, product, priceBook))
  }

  /** Switch template: its own part colours, but keep the helmet, size, finish, trims and personal details. */
  const chooseTemplate = (slug: string) => {
    const next = products.find((item) => item.slug === slug)
    if (!next || next.slug === product.slug) return
    const kept = Object.fromEntries(carriedOver.map((key) => [key, config[key]]))
    setProduct(next)
    setConfig(normaliseConfiguration({ ...getInitialConfiguration(next, priceBook), ...kept, template: next.slug }, next, priceBook))
  }

  const reset = () => setConfig(getInitialConfiguration(product, priceBook))

  return {
    product,
    config,
    update,
    chooseTemplate,
    reset,
    look: configurationToLook(product, config, priceBook),
    price: calculateHelmetPrice(product, config, priceBook),
    summary: summariseConfiguration(product, config, priceBook),
  }
}
