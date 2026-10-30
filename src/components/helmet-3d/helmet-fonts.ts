import {
  Anton,
  Audiowide,
  Bebas_Neue,
  Black_Ops_One,
  Exo_2,
  Kaushan_Script,
  Michroma,
  Orbitron,
  Permanent_Marker,
  Racing_Sans_One,
  Russo_One,
  Teko,
} from "next/font/google"

import type { HelmetFont } from "@/types/configurator"

// Lettering for names, numbers and the visor strip. Self-hosted by next/font and not
// preloaded: the browser only fetches a font when the builder draws or previews it.
const racingSans = Racing_Sans_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const russo = Russo_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const orbitron = Orbitron({ subsets: ["latin"], display: "swap", preload: false })
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const teko = Teko({ subsets: ["latin"], display: "swap", preload: false })
const audiowide = Audiowide({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const blackOps = Black_Ops_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const michroma = Michroma({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const exo = Exo_2({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", preload: false })
const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const kaushan = Kaushan_Script({ weight: "400", subsets: ["latin"], display: "swap", preload: false })
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap", preload: false })

export interface HelmetFontStyle {
  id: HelmetFont
  label: string
  /** CSS font-family list, usable in a style attribute and on a canvas. */
  family: string
  /** The weight this font is drawn at before "bold" is applied. */
  weight: number
  /** Whether the font is slanted by default (the original "racing" and "script" were). */
  italic: boolean
}

export const helmetFontStyles: HelmetFontStyle[] = [
  // The three original fonts, unchanged so saved designs look the same.
  { id: "racing", label: "Racing", family: "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif", weight: 900, italic: true },
  { id: "block", label: "Block", family: "Impact, 'Haettenschweiler', 'Arial Black', sans-serif", weight: 800, italic: false },
  { id: "script", label: "Script", family: "'Brush Script MT', 'Segoe Script', cursive", weight: 700, italic: true },
  { id: "racing-sans", label: "Racing Sans", family: racingSans.style.fontFamily, weight: 400, italic: false },
  { id: "russo", label: "Russo", family: russo.style.fontFamily, weight: 400, italic: false },
  { id: "orbitron", label: "Orbitron", family: orbitron.style.fontFamily, weight: 800, italic: false },
  { id: "bebas", label: "Bebas", family: bebas.style.fontFamily, weight: 400, italic: false },
  { id: "teko", label: "Teko", family: teko.style.fontFamily, weight: 600, italic: false },
  { id: "audiowide", label: "Audiowide", family: audiowide.style.fontFamily, weight: 400, italic: false },
  { id: "black-ops", label: "Black Ops", family: blackOps.style.fontFamily, weight: 400, italic: false },
  { id: "michroma", label: "Michroma", family: michroma.style.fontFamily, weight: 400, italic: false },
  { id: "exo", label: "Exo", family: exo.style.fontFamily, weight: 800, italic: true },
  { id: "anton", label: "Anton", family: anton.style.fontFamily, weight: 400, italic: false },
  { id: "kaushan", label: "Kaushan", family: kaushan.style.fontFamily, weight: 400, italic: false },
  { id: "marker", label: "Marker", family: marker.style.fontFamily, weight: 400, italic: false },
]

export function helmetFont(id: string | undefined): HelmetFontStyle {
  return helmetFontStyles.find((font) => font.id === id) ?? helmetFontStyles[0]
}

/** A canvas / CSS font shorthand for a piece of lettering. */
export function canvasFont(id: string | undefined, size: number, options: { bold?: boolean; italic?: boolean } = {}): string {
  const font = helmetFont(id)
  const italic = options.italic ?? font.italic
  const weight = options.bold ? Math.max(700, font.weight) : font.weight
  return `${italic ? "italic " : ""}${weight} ${Math.round(size)}px ${font.family}`
}
