import type { FilmPattern, HelmetModel } from "@/types/helmet"

export interface Film {
  id: string
  name: string
  category: string
  pattern: FilmPattern
  price: number
  isActive: boolean
  sortOrder: number
}

export type OptionGroupKey = "route" | "finish" | "base" | "trim" | "spoiler"

export const optionGroupKeys: OptionGroupKey[] = ["route", "finish", "base", "trim", "spoiler"]

export interface ConfiguratorOption {
  group: OptionGroupKey
  value: string
  label: string
  hint: string | null
  swatch: string | null
  price: number
  isActive: boolean
  sortOrder: number
}

/** Everything needed to price and render the configurator. */
export interface PriceBook {
  models: HelmetModel[]
  films: Film[]
  options: Record<OptionGroupKey, ConfiguratorOption[]>
}
