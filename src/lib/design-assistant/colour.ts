// Colour maths for matching photos to designs. Distances use CIELAB, which
// tracks how different two colours look far better than raw RGB does.

type Rgb = [number, number, number]
type Lab = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const clamp = (channel: number) => Math.min(255, Math.max(0, Math.round(channel) || 0))
  return `#${[r, g, b].map((channel) => clamp(channel).toString(16).padStart(2, "0")).join("")}`
}

function toLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function labCurve(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116
}

export function rgbToLab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  // sRGB to XYZ (D65), normalised by the reference white.
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883
  const [fx, fy, fz] = [labCurve(x), labCurve(y), labCurve(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** Perceptual difference between two colours (CIE76). Under ~10 looks alike; over ~50 is clearly different. */
export function colourDistance(a: string, b: string): number {
  const [l1, a1, b1] = rgbToLab(hexToRgb(a))
  const [l2, a2, b2] = rgbToLab(hexToRgb(b))
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

/** 0 for greys, up to ~1 for vivid colours. */
export function saturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

/** 0 for black, 1 for white. */
export function lightness(hex: string): number {
  return rgbToLab(hexToRgb(hex))[0] / 100
}

// Names customers would use, deliberately plain.
const namedColours: { name: string; hex: string }[] = [
  { name: "black", hex: "#111412" },
  { name: "charcoal", hex: "#3a3d3b" },
  { name: "grey", hex: "#8a8d8b" },
  { name: "silver", hex: "#c4c7c9" },
  { name: "white", hex: "#f4f3ee" },
  { name: "red", hex: "#d42027" },
  { name: "dark red", hex: "#7d1416" },
  { name: "orange", hex: "#f2711c" },
  { name: "gold", hex: "#c9a227" },
  { name: "yellow", hex: "#f5d300" },
  { name: "lime", hex: "#c6f432" },
  { name: "green", hex: "#1f9d55" },
  { name: "racing green", hex: "#0f4d2e" },
  { name: "teal", hex: "#0f8b8d" },
  { name: "sky blue", hex: "#4fb3ff" },
  { name: "blue", hex: "#1f5bd8" },
  { name: "navy", hex: "#14254d" },
  { name: "purple", hex: "#6a3fb5" },
  { name: "pink", hex: "#ff5fa2" },
  { name: "brown", hex: "#6b4426" },
  { name: "beige", hex: "#d8c7a3" },
]

// Extra words people use for the same colours.
const colourAliases: Record<string, string> = {
  gray: "grey",
  "dark blue": "navy",
  "light blue": "sky blue",
  cyan: "sky blue",
  turquoise: "teal",
  violet: "purple",
  magenta: "pink",
  "fluro yellow": "lime",
  neon: "lime",
  "british racing green": "racing green",
  maroon: "dark red",
  burgundy: "dark red",
  cream: "beige",
}

/** Colours named in free text, in the order they appear, as hex values. */
export function coloursInText(text: string): string[] {
  const lower = ` ${text.toLowerCase().replace(/[^a-z\s]/g, " ")} `
  const words = [
    ...namedColours.map(({ name }) => ({ word: name, name })),
    ...Object.entries(colourAliases).map(([word, name]) => ({ word, name })),
  ].sort((a, b) => b.word.length - a.word.length)

  const found: { index: number; hex: string }[] = []
  let remaining = lower
  for (const { word, name } of words) {
    const index = remaining.indexOf(` ${word} `)
    if (index === -1) continue
    // Blank out the match so "dark red" isn't counted again as "red".
    remaining = remaining.slice(0, index + 1) + " ".repeat(word.length) + remaining.slice(index + 1 + word.length)
    const hex = namedColours.find((named) => named.name === name)?.hex
    if (hex && !found.some((item) => item.hex === hex)) found.push({ index, hex })
  }
  return found.sort((a, b) => a.index - b.index).map((item) => item.hex)
}

export function nameColour(hex: string): string {
  let best = namedColours[0]
  let bestDistance = Infinity
  for (const named of namedColours) {
    const distance = colourDistance(hex, named.hex)
    if (distance < bestDistance) {
      best = named
      bestDistance = distance
    }
  }
  return best.name
}
