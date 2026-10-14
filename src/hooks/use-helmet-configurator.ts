"use client"

import { useState } from "react"

import {
  configurationToLook,
  getDisabledGroups,
  getInitialConfiguration,
  getOptionGroups,
  normaliseConfiguration,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import { calculateHelmetPrice } from "@/lib/pricing/helmet-price"
import type { PriceBook } from "@/types/catalog"
import type { ConfigKey, HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

/**
 * Configuration state for one product, kept separate from how it's displayed.
 * `startFrom` lets a shared link open a specific build; Reset returns to the design's default.
 */
export function useHelmetConfigurator(product: CatalogProduct, priceBook: PriceBook, startFrom?: HelmetConfiguration) {
  const [initial] = useState(() => getInitialConfiguration(product, priceBook))
  const [config, setConfig] = useState<HelmetConfiguration>(() => startFrom ?? initial)

  const setOption = (key: ConfigKey, value: string) => {
    setConfig((current) => normaliseConfiguration({ ...current, [key]: value }, product, priceBook))
  }

  const groups = getOptionGroups(product, priceBook, config)
  const isDirty = (Object.keys(initial) as ConfigKey[]).some((key) => initial[key] !== config[key])

  return {
    groups,
    config,
    setOption,
    reset: () => setConfig(initial),
    isDirty,
    disabled: getDisabledGroups(config),
    look: configurationToLook(product, config, priceBook),
    summary: summariseConfiguration(groups, config),
    price: calculateHelmetPrice(product.startingPrice, config, priceBook),
  }
}
