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

export type HelmetConfiguration = Record<ConfigKey, string>

export interface ConfigSummaryLine {
  key: ConfigKey
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
