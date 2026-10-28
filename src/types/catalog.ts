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

export type OptionGroupKey = "route" | "finish" | "base" | "trim" | "spoiler" | "material" | "visor_strip" | "personalisation"

export const optionGroupKeys: OptionGroupKey[] = ["route", "finish", "base", "trim", "spoiler", "material", "visor_strip", "personalisation"]

export interface ConfiguratorOption {
  group: OptionGroupKey
  value: string
  label: string
  hint: string | null
  swatch: string | null
  /** Null means the price is still to be agreed: previewable, but checkout is blocked. */
  price: number | null
  isActive: boolean
  sortOrder: number
}

/** True when anything the customer picked has no agreed price yet. */
export function isPriceOnRequest(option: Pick<ConfiguratorOption, "price"> | undefined | null): boolean {
  return option != null && option.price === null
}

/** Everything needed to price and render the configurator. */
export interface PriceBook {
  models: HelmetModel[]
  films: Film[]
  options: Record<OptionGroupKey, ConfiguratorOption[]>
}
