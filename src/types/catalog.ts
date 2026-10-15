import type { FilmPattern, HelmetModel } from "@/types/helmet"

export interface Film {
  id: string
  name: string
  /** Supplier's film code, e.g. "TSWD2232". */
  code: string
  category: string
  /** Illustrated stand-in, used when the film has no image. */
  pattern: FilmPattern
  /** 512px tile applied to the 3D helmet and the illustration. Null for "Solid colour". */
  textureUrl: string | null
  /** 160px swatch for the picker. */
  thumbUrl: string | null
  /** Roll widths in stock, e.g. ["0.5m", "1m"]. */
  widths: string[]
  price: number
  isActive: boolean
  sortOrder: number
}

export type OptionGroupKey = "route" | "finish" | "base" | "trim" | "spoiler" | "material"

export const optionGroupKeys: OptionGroupKey[] = ["route", "finish", "base", "trim", "spoiler", "material"]

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
