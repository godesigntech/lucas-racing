"use client"

import { useState } from "react"
import { helmetParts } from "@/lib/helmet-3d/parts"

import {
  calculateHelmetPrice,
  configurationToLook,
  getInitialConfiguration,
  normaliseConfiguration,
  summariseConfiguration,
  type BuilderExtras,
} from "@/lib/configurator/helmet-configuration"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

/** Everything that carries over when the customer switches template: only the design's own colours reset. */
const carriedOver = [...helmetParts.map(({ key }) => key), "model", "size", "route", "finish", "baseCoat", "trim", "spoiler", "aero", "spoilers", "spoilerFinish", "visor", "visorKit", "visorScrews", "visorScrewStyle", "visorStrip", "personalisation", "logos", "riderName", "namePosition", "raceNumber", "numberPosition", "logo", "logoPosition"] as const

/**
 * Builder state: the chosen template (design) and the build on it, kept valid as
 * the customer changes things. Look, price and summary are derived from it.
 */
export function useHelmetConfigurator(
  products: CatalogProduct[],
  priceBook: PriceBook,
  start: { product: CatalogProduct; config?: HelmetConfiguration },
  /**
   * The template's regions, aero kits and visors, so price and summary match the build.
   * It's a function of the build because the regions depend on the helmet chosen.
   */
  getExtras: (config: HelmetConfiguration) => BuilderExtras = () => ({}),
) {
  const [product, setProduct] = useState(start.product)
  const [config, setConfig] = useState<HelmetConfiguration>(() =>
    start.config ? normaliseConfiguration(start.config, start.product, priceBook) : getInitialConfiguration(start.product, priceBook),
  )

  /** Change any fields; the result is re-validated (e.g. a size the new helmet doesn't come in). */
  const update = (changes: Partial<HelmetConfiguration>) => {
    // Each helmet has its own templates: a helmet this design isn't drawn for moves the
    // build to that helmet's first design, keeping everything that carries over.
    if (changes.model && !product.models.includes(changes.model)) {
      const next = products.find((item) => item.models.includes(changes.model!))
      if (next) {
        const kept = Object.fromEntries(carriedOver.map((key) => [key, config[key]]))
        setProduct(next)
        setConfig(normaliseConfiguration({ ...getInitialConfiguration(next, priceBook), ...kept, ...changes, template: next.slug }, next, priceBook))
        return
      }
    }
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
    price: calculateHelmetPrice(product, config, priceBook, getExtras(config)),
    summary: summariseConfiguration(product, config, priceBook, getExtras(config)),
  }
}
