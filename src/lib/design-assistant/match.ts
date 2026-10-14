import type { DesignAnalysis, DesignBrief, DesignSuggestion } from "@/types/design-assistant"
import type { FilmPattern, HelmetFinish, HelmetLayout, HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

import { colourDistance, coloursInText, lightness, nameColour, saturation } from "./colour"

// Rules-based matcher: turns a photo's colours and the customer's note into a
// concept and the closest catalogue designs. It needs no external service, and
// is the fallback whenever no AI provider is configured.

const WHITE = "#f4f3ee"
const BLACK = "#111412"
/** Colours closer than this count as "the same colour" when explaining a match. */
const SHARED_COLOUR = 24
/** Colours closer than this are too alike to use as base and graphic together. */
const DISTINCT_COLOUR = 28

const layoutPhrases: Record<HelmetLayout, string> = {
  apex: "an apex sweep",
  twin: "twin stripes",
  split: "split panels",
  shard: "angular shards",
  halo: "a halo band",
  flow: "a flowing wave",
  blank: "a clean, graphic-free finish",
}

const filmLabels: Record<FilmPattern, string> = {
  none: "",
  carbon: "carbon",
  forged: "forged carbon",
  hex: "hex",
  camo: "camo",
}

const keywordRules: {
  finish: [RegExp, HelmetFinish][]
  film: [RegExp, FilmPattern][]
  layout: [RegExp, HelmetLayout][]
} = {
  finish: [
    [/\bchrome\b|\bmirror\b/, "chrome"],
    [/\bmatt(e)?\b|\bsatin\b|\bflat\b/, "matte"],
    [/\bgloss(y)?\b|\bshiny\b/, "gloss"],
  ],
  film: [
    [/\bforged\b/, "forged"],
    [/\bcarbon\b/, "carbon"],
    [/\bhex\b|\bhoneycomb\b/, "hex"],
    [/\bcamo(uflage)?\b/, "camo"],
  ],
  layout: [
    [/\bstripes?\b/, "twin"],
    [/\bflames?\b|\bwaves?\b|\bflow(ing)?\b/, "flow"],
    [/\bshards?\b|\bangular\b|\bsharp\b|\bgeometric\b/, "shard"],
    [/\bhalo\b|\bband\b|\bring\b/, "halo"],
    [/\bsplit\b|\bhalf\b|\btwo[- ]tone\b/, "split"],
    [/\bapex\b|\bsweep\b/, "apex"],
    [/\bplain\b|\bclean\b|\bminimal\b|\bsimple\b/, "blank"],
  ],
}

function firstMatch<T>(text: string, rules: [RegExp, T][]): T | undefined {
  return rules.find(([pattern]) => pattern.test(text))?.[1]
}

interface Preferences {
  finish?: HelmetFinish
  film?: FilmPattern
  layout?: HelmetLayout
  number?: string
}

function readPreferences(note: string): Preferences {
  const text = note.toLowerCase()
  return {
    finish: firstMatch(text, keywordRules.finish),
    film: firstMatch(text, keywordRules.film),
    layout: firstMatch(text, keywordRules.layout),
    number: text.match(/\b(?:number|no\.?|#)\s*(\d{1,3})\b/)?.[1],
  }
}

/** Colours named in the note come first: they're what the customer actually asked for. */
function combinedPalette(brief: DesignBrief): string[] {
  const merged: string[] = []
  for (const hex of [...coloursInText(brief.note), ...brief.palette.map((colour) => colour.toLowerCase())]) {
    if (!merged.some((existing) => colourDistance(existing, hex) < 12)) merged.push(hex)
  }
  return merged.slice(0, 6)
}

function joinNames(names: string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
}

function scoreProduct(product: CatalogProduct, palette: string[], note: string, prefs: Preferences) {
  const { look } = product
  const designColours = [look.base, look.graphic, look.accent]

  // Weighted closeness of each photo colour to the design's colours (dominant colours count most).
  let colourScore = 0
  let totalWeight = 0
  const shared: string[] = []
  palette.forEach((hex, index) => {
    const weight = 1 / (index + 1)
    const closest = Math.min(...designColours.map((colour) => colourDistance(hex, colour)))
    colourScore += weight * Math.max(0, 1 - closest / 60)
    totalWeight += weight
    const name = nameColour(hex)
    if (closest < SHARED_COLOUR && !shared.includes(name)) shared.push(name)
  })
  colourScore = totalWeight ? colourScore / totalWeight : 0

  const text = note.toLowerCase()
  const namedDesign = text.includes(product.name.toLowerCase())
  const layoutMatch = prefs.layout === look.layout
  const filmMatch = Boolean(prefs.film) && prefs.film === look.film
  const finishMatch = Boolean(prefs.finish) && prefs.finish === look.finish
  const score =
    colourScore + (namedDesign ? 0.5 : 0) + (layoutMatch ? 0.2 : 0) + (filmMatch ? 0.12 : 0) + (finishMatch ? 0.08 : 0)

  let reason: string
  if (namedDesign) reason = "The design you mentioned"
  else if (layoutMatch) reason = `Has the ${layoutPhrases[look.layout].replace(/^an? /, "")} you described`
  else if (shared.length) reason = `Shares your ${joinNames(shared.slice(0, 2))}`
  else if (filmMatch) reason = `Uses the ${filmLabels[look.film]} film you mentioned`
  else reason = "A good starting point for your colours"

  return { score, reason }
}

/** Base, graphic and accent colours for the concept, taken from the customer's palette. */
function pickColours(palette: string[], fallback: HelmetLook) {
  const base = palette[0] ?? fallback.base
  const others = palette.slice(1)

  // The graphic should stand out from the base: favour distant, vivid colours.
  const graphic =
    others
      .filter((hex) => colourDistance(hex, base) >= DISTINCT_COLOUR)
      .sort((a, b) => colourDistance(b, base) * (0.6 + saturation(b)) - colourDistance(a, base) * (0.6 + saturation(a)))[0] ??
    (colourDistance(fallback.graphic, base) >= DISTINCT_COLOUR ? fallback.graphic : lightness(base) > 0.6 ? BLACK : WHITE)

  const accent =
    others.find((hex) => hex !== graphic && colourDistance(hex, base) >= DISTINCT_COLOUR && colourDistance(hex, graphic) >= DISTINCT_COLOUR) ??
    (lightness(base) > 0.6 ? BLACK : WHITE)

  return { base, graphic, accent }
}

function describe(look: HelmetLook, product: CatalogProduct): string {
  const base = nameColour(look.base)
  const graphic = nameColour(look.graphic)
  const accent = nameColour(look.accent)
  const film = filmLabels[look.film]

  const first =
    look.layout === "blank"
      ? `A ${look.finish} ${base} shell with ${accent} pinstripes and a clean, graphic-free finish.`
      : `A ${look.finish} ${base} shell with ${layoutPhrases[look.layout]} in ${graphic}${film ? ` ${film} film` : ""}, picked out with ${accent} pinstripes.`
  const number = look.number ? `, with your number ${look.number} on the side` : ""
  return `${first} It builds on our ${product.name} design${number}.`
}

function toSuggestion(product: CatalogProduct, reason: string): DesignSuggestion {
  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    look: product.look,
    startingPrice: product.startingPrice,
    reason,
  }
}

/** Builds a concept and finds the closest designs for a brief. Returns null when there's nothing to match. */
export function matchDesign(brief: DesignBrief, products: CatalogProduct[]): DesignAnalysis | null {
  const candidates = products.filter((product) => product.isActive)
  if (candidates.length === 0) return null

  const palette = combinedPalette(brief)
  const prefs = readPreferences(brief.note)
  const ranked = candidates
    .map((product) => ({ product, ...scoreProduct(product, palette, brief.note, prefs) }))
    .sort((a, b) => b.score - a.score)

  // Build on a design with the layout they asked for, if we have one.
  const top = (prefs.layout && ranked.find(({ product }) => product.look.layout === prefs.layout)?.product) || ranked[0].product
  const colours = pickColours(palette, top.look)
  const concept: HelmetLook = {
    ...top.look,
    ...colours,
    layout: prefs.layout ?? top.look.layout,
    finish: prefs.finish ?? top.look.finish,
    film: prefs.film ?? top.look.film,
    trim: saturation(colours.graphic) > 0.35 ? colours.graphic : colours.accent,
    number: prefs.number,
    name: undefined,
  }

  return {
    summary: describe(concept, top),
    palette: palette.map((hex) => ({ hex, name: nameColour(hex) })),
    concept,
    basedOn: top.slug,
    // The design the concept builds on leads the list.
    suggestions: [...ranked.filter(({ product }) => product === top), ...ranked.filter(({ product }) => product !== top)]
      .slice(0, 3)
      .map(({ product, reason }) => toSuggestion(product, reason)),
  }
}
