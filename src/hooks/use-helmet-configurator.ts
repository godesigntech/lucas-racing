"use client"

import { useMemo, useState } from "react"

import {
  configurationToLook,
  getDisabledGroups,
  getInitialConfiguration,
  getOptionGroups,
  summariseConfiguration,
} from "@/lib/configurator/helmet-configuration"
import type { ConfigKey, HelmetConfiguration } from "@/types/configurator"
import type { Product } from "@/types/product"

/** Configuration state for one product, kept separate from how it's displayed. */
export function useHelmetConfigurator(product: Product) {
  const groups = useMemo(() => getOptionGroups(product), [product])
  const initial = useMemo(() => getInitialConfiguration(product), [product])
  const [config, setConfig] = useState<HelmetConfiguration>(initial)

  const setOption = (key: ConfigKey, value: string) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const reset = () => setConfig(initial)

  const isDirty = (Object.keys(initial) as ConfigKey[]).some((key) => initial[key] !== config[key])

  return {
    groups,
    config,
    setOption,
    reset,
    isDirty,
    disabled: getDisabledGroups(config),
    look: configurationToLook(product, config),
    summary: summariseConfiguration(groups, config),
  }
}
