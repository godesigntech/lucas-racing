export type ConfigKey =
  | "model"
  | "route"
  | "size"
  | "finish"
  | "base"
  | "film"
  | "trim"
  | "spoiler"

export const configKeys: ConfigKey[] = ["model", "route", "size", "finish", "base", "film", "trim", "spoiler"]

export type ConfigOptionKind = "swatch" | "choice"

export interface ConfigChoice {
  value: string
  label: string
  /** CSS colour shown for swatch options. */
  swatch?: string
  hint?: string
  /** Extra cost of this choice, if any. */
  price?: number
}

export interface ConfigOptionGroup {
  key: ConfigKey
  label: string
  kind: ConfigOptionKind
  description?: string
  choices: ConfigChoice[]
}

/** Optional personal touches. Free: the workshop places them on the proof. */
export interface Personalisation {
  /** Rider name, up to 24 characters. */
  riderName?: string
  /** Race number, up to 3 letters or digits. */
  raceNumber?: string
  /** Storage path of an uploaded logo in the design-logos bucket. */
  logo?: string
}

export type PersonalisationKey = keyof Personalisation

export type HelmetConfiguration = Record<ConfigKey, string> & Personalisation

export interface ConfigSummaryLine {
  key: ConfigKey | PersonalisationKey
  label: string
  value: string
}

export interface PriceLine {
  label: string
  amount: number
}

export interface PriceBreakdown {
  lines: PriceLine[]
  total: number
}
