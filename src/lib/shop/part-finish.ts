import type { PriceBook } from "@/types/catalog"
import type { ConfigSummaryLine } from "@/types/configurator"
import type { FinishType, ShopProduct } from "@/types/shop"

// Custom finishes for MS Kart parts by HydroKarts. Prices come from the helmet price
// list, so this mirrors place_order() (migration 1500), which has the final say.

/** The finish chosen for a part: a paint colour or film, with a lacquer (chrome has none). */
export interface PartFinish {
  type: FinishType
  /** Paint: the colour value. Film: the film id. Chrome: "chrome". */
  value: string
  /** Lacquer option ("gloss", "satin", "matte"); empty for chrome. */
  lacquer: string
}

export const finishLabels: Record<FinishType, string> = {
  paint: "Paint",
  film: "Hydro-dip film",
  chrome: "Chrome",
}

export function isCustomisable(product: Pick<ShopProduct, "customisable" | "customFinishes">): boolean {
  return product.customisable && product.customFinishes.length > 0
}

export const sameFinish = (a: PartFinish | undefined, b: PartFinish | undefined) =>
  (a?.type ?? "") === (b?.type ?? "") && (a?.value ?? "") === (b?.value ?? "") && (a?.lacquer ?? "") === (b?.lacquer ?? "")

/** Paint colours, films with a texture, chrome and lacquers that can be offered now. */
export function finishChoices(priceBook: PriceBook) {
  return {
    colours: priceBook.options.base.filter((option) => option.isActive),
    films: priceBook.films.filter((film) => film.isActive && film.textureUrl),
    chrome: priceBook.options.material.find((option) => option.value === "chrome" && option.isActive) ?? null,
    lacquers: priceBook.options.finish.filter((option) => option.isActive),
  }
}

export interface FinishPrice {
  /** Fee plus finish plus lacquer: what's added to the part's price. */
  extra: number
  summary: ConfigSummaryLine[]
}

/** Prices a finish for a product, or returns null if it isn't allowed or available. */
export function priceFinish(product: Pick<ShopProduct, "customFinishes" | "customFee">, finish: PartFinish, priceBook: PriceBook): FinishPrice | null {
  if (!product.customFinishes.includes(finish.type)) return null
  const { colours, films, chrome, lacquers } = finishChoices(priceBook)
  let extra = product.customFee
  const summary: ConfigSummaryLine[] = []

  if (finish.type === "paint") {
    const colour = colours.find((option) => option.value === finish.value)
    if (!colour) return null
    extra += colour.price
    summary.push({ key: "finish", label: "Finish", value: `Paint · ${colour.label}` })
  } else if (finish.type === "film") {
    const film = films.find((item) => item.id === finish.value)
    if (!film) return null
    extra += film.price
    summary.push({ key: "finish", label: "Finish", value: `Hydro-dip film · ${film.name}` })
  } else {
    if (!chrome) return null
    extra += chrome.price
    summary.push({ key: "finish", label: "Finish", value: chrome.label })
  }

  if (finish.type !== "chrome") {
    const lacquer = lacquers.find((option) => option.value === finish.lacquer)
    if (!lacquer) return null
    extra += lacquer.price
    summary.push({ key: "lacquer", label: "Lacquer", value: lacquer.label })
  }
  return { extra: Math.round(extra * 100) / 100, summary }
}

/** A sensible first choice for the picker: the first allowed finish with its first options. */
export function defaultFinish(product: Pick<ShopProduct, "customFinishes">, priceBook: PriceBook): PartFinish | null {
  const { colours, films, chrome, lacquers } = finishChoices(priceBook)
  const lacquer = lacquers[0]?.value ?? ""
  for (const type of product.customFinishes) {
    if (type === "paint" && colours[0]) return { type, value: colours[0].value, lacquer }
    if (type === "film" && films[0]) return { type, value: films[0].id, lacquer }
    if (type === "chrome" && chrome) return { type, value: "chrome", lacquer: "" }
  }
  return null
}

/** The cheapest a customised part can be: for "from £…" on cards. */
export function lowestFinishExtra(product: Pick<ShopProduct, "customFinishes" | "customFee">, priceBook: PriceBook): number {
  const { colours, films, chrome, lacquers } = finishChoices(priceBook)
  const lacquer = Math.min(...lacquers.map((option) => option.price), Infinity)
  const options: number[] = []
  if (product.customFinishes.includes("paint") && colours.length) options.push(Math.min(...colours.map((c) => c.price)) + lacquer)
  if (product.customFinishes.includes("film") && films.length) options.push(Math.min(...films.map((f) => f.price)) + lacquer)
  if (product.customFinishes.includes("chrome") && chrome) options.push(chrome.price)
  const lowest = Math.min(...options.filter(Number.isFinite))
  return product.customFee + (Number.isFinite(lowest) ? lowest : 0)
}

/** Customisable HydroKarts parts live under Customisation; everything else in the shop. */
export function productHref(product: Pick<ShopProduct, "storeId" | "slug">): string {
  return product.storeId === "hydrokarts-parts" ? `/customisation/kart-parts/${product.slug}` : `/shop/p/${product.slug}`
}
