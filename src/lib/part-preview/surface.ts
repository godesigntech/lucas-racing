// Live 2D preview for MS Kart parts by HydroKarts: a paint colour, hydro-dip film or
// chrome drawn onto a photo of the part, keeping its outline, holes, shading and detail.
//
// Pure pixel maths on RGBA arrays, with no imports, so the browser preview and the
// sample-preparation script (scripts/prepare-kart-parts.mjs) share it.

/** Longest side, in pixels, the preview is drawn at. */
export const PREVIEW_SIZE = 900

/** RGBA pixels, as from canvas getImageData(). */
export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** A part photo, analysed once and reused for every finish. */
export interface Surface {
  width: number
  height: number
  /** The photo (RGBA), with its background made transparent when an outline was given. */
  base: Uint8ClampedArray
  /** 0..1: how much each pixel is finished. */
  mask: Float32Array
  /** Broad light and shade on the part (about 1 on average), without its printed pattern. */
  light: Float32Array
  /** Fine detail: engraving, machined edges, the bearing (about 0 on average). */
  fine: Float32Array
  /** 0 at the edge of the part, 1 inside: rounds the edges off. */
  rim: Float32Array
}

export type Lacquer = "gloss" | "satin" | "matte" | ""

/** What to draw onto the part. Film tiles are already sized to the part (see filmTileSize). */
export type SurfaceFinish =
  | { kind: "paint"; colour: [number, number, number] }
  | { kind: "film"; tile: Pixels }
  | { kind: "chrome" }

const luma = (data: ArrayLike<number>, index: number) => (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255

/** Box blur, run three times (close to a Gaussian). */
export function blur(source: Float32Array, width: number, height: number, radius: number): Float32Array {
  let current = source
  const r = Math.max(1, Math.round(radius))
  for (let pass = 0; pass < 3; pass += 1) {
    const horizontal = new Float32Array(current.length)
    for (let y = 0; y < height; y += 1) {
      const row = y * width
      let sum = 0
      for (let x = -r; x <= r; x += 1) sum += current[row + Math.min(width - 1, Math.max(0, x))]
      for (let x = 0; x < width; x += 1) {
        horizontal[row + x] = sum / (2 * r + 1)
        sum += current[row + Math.min(width - 1, x + r + 1)] - current[row + Math.max(0, x - r)]
      }
    }
    const vertical = new Float32Array(current.length)
    for (let x = 0; x < width; x += 1) {
      let sum = 0
      for (let y = -r; y <= r; y += 1) sum += horizontal[Math.min(height - 1, Math.max(0, y)) * width + x]
      for (let y = 0; y < height; y += 1) {
        vertical[y * width + x] = sum / (2 * r + 1)
        sum += horizontal[Math.min(height - 1, y + r + 1) * width + x] - horizontal[Math.max(0, y - r) * width + x]
      }
    }
    current = vertical
  }
  return current
}

/**
 * Finds the part in a photo: transparent pixels, or the plain background colour touching
 * the edges, plus enclosed patches of it (the holes). Returns 0 (background) to 255 (part).
 */
export function findPartMask({ data, width, height }: Pixels): Uint8Array {
  const count = width * height
  const mask = new Uint8Array(count)

  let transparent = 0
  for (let i = 0; i < count; i += 1) if (data[i * 4 + 3] < 128) transparent += 1
  if (transparent > count * 0.01) {
    for (let i = 0; i < count; i += 1) mask[i] = data[i * 4 + 3]
    return mask
  }

  // Background colour: the median of each channel around the border.
  const border: number[][] = [[], [], []]
  const sample = (i: number) => {
    for (let c = 0; c < 3; c += 1) border[c].push(data[i * 4 + c])
  }
  for (let x = 0; x < width; x += 1) {
    sample(x)
    sample((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    sample(y * width)
    sample(y * width + width - 1)
  }
  const background = border.map((values) => values.sort((a, b) => a - b)[values.length >> 1])
  // Tight: studio backgrounds are one flat colour, while glare on the part is brighter.
  const tolerance = 4
  const isBackground = (i: number) =>
    Math.abs(data[i * 4] - background[0]) <= tolerance &&
    Math.abs(data[i * 4 + 1] - background[1]) <= tolerance &&
    Math.abs(data[i * 4 + 2] - background[2]) <= tolerance

  // Group background-coloured pixels into patches. Patches touching the border are the
  // background; enclosed ones are holes unless tiny (a pale fleck in the print).
  const seen = new Uint8Array(count)
  const smallest = Math.max(24, Math.round(count * 0.00004))
  const stack = new Int32Array(count)
  const patch: number[] = []
  for (let start = 0; start < count; start += 1) {
    if (seen[start] || !isBackground(start)) continue
    let top = 0
    stack[top++] = start
    seen[start] = 1
    patch.length = 0
    let touchesBorder = false
    while (top > 0) {
      const i = stack[--top]
      patch.push(i)
      const x = i % width
      const y = (i - x) / width
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true
      for (let n = 0; n < 4; n += 1) {
        const next = n === 0 ? (x > 0 ? i - 1 : -1) : n === 1 ? (x < width - 1 ? i + 1 : -1) : n === 2 ? (y > 0 ? i - width : -1) : y < height - 1 ? i + width : -1
        if (next >= 0 && !seen[next] && isBackground(next)) {
          seen[next] = 1
          stack[top++] = next
        }
      }
    }
    const isPart = !touchesBorder && patch.length < smallest
    for (const i of patch) mask[i] = isPart ? 255 : 0
  }
  for (let i = 0; i < count; i += 1) if (!seen[i]) mask[i] = 255

  // Pull the edge in by a pixel (the photo's edge pixels are half background) and soften it.
  const eroded = new Float32Array(count)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x
      eroded[i] =
        mask[i] && x > 0 && y > 0 && x < width - 1 && y < height - 1 && mask[i - 1] && mask[i + 1] && mask[i - width] && mask[i + width] ? 1 : 0
    }
  }
  const soft = blur(eroded, width, height, 1)
  for (let i = 0; i < count; i += 1) mask[i] = Math.round(Math.min(1, soft[i] * 1.6 - 0.3 > 0 ? soft[i] * 1.6 - 0.3 : 0) * 255)
  return mask
}

/** Reads a mask image: its transparency if it has any, otherwise its brightness. */
export function maskFromPixels({ data, width, height }: Pixels): Uint8Array {
  const count = width * height
  const mask = new Uint8Array(count)
  let hasAlpha = false
  for (let i = 0; i < count; i += 1) {
    if (data[i * 4 + 3] < 250) {
      hasAlpha = true
      break
    }
  }
  for (let i = 0; i < count; i += 1) mask[i] = hasAlpha ? data[i * 4 + 3] : Math.round(luma(data, i * 4) * 255)
  return mask
}

/**
 * Analyses a photo and its mask once: shading, fine detail and rounded edges.
 * `outline` (the whole part, from findPartMask) clears the studio background so the
 * part sits on any page colour; bare areas like a steel shaft stay visible.
 */
export function buildSurface(photo: Pixels, maskValues: Uint8Array, outline?: Uint8Array): Surface {
  const { width, height } = photo
  const count = width * height
  let data = photo.data
  if (outline) {
    data = new Uint8ClampedArray(photo.data)
    for (let i = 0; i < count; i += 1) data[i * 4 + 3] = Math.min(data[i * 4 + 3], Math.max(outline[i], maskValues[i]))
  }
  const side = Math.max(width, height)
  const mask = new Float32Array(count)
  const lit = new Float32Array(count)
  const lum = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    mask[i] = maskValues[i] / 255
    lum[i] = luma(data, i * 4)
    lit[i] = lum[i] * mask[i]
  }

  // Shading averaged only over the part, so the background doesn't bleed in at the edges.
  const coarseLit = blur(lit, width, height, side / 16)
  const coarseMask = blur(mask, width, height, side / 16)
  const fineLit = blur(lit, width, height, side / 220)
  const fineMask = blur(mask, width, height, side / 220)
  const edge = blur(mask, width, height, side / 90)

  let total = 0
  let weight = 0
  const shade = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    shade[i] = coarseMask[i] > 0.001 ? coarseLit[i] / coarseMask[i] : 0
    total += shade[i] * mask[i]
    weight += mask[i]
  }
  const mean = weight > 0 ? total / weight : 0.5

  const light = new Float32Array(count)
  const fine = new Float32Array(count)
  const rim = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    light[i] = Math.min(1.6, Math.max(0.35, 1 + (shade[i] / Math.max(mean, 0.05) - 1) * 0.6))
    const local = fineMask[i] > 0.001 ? fineLit[i] / fineMask[i] : lum[i]
    fine[i] = Math.max(-0.5, Math.min(0.5, lum[i] - local))
    const t = Math.min(1, Math.max(0, (edge[i] - 0.5) / 0.5))
    rim[i] = t * t * (3 - 2 * t)
  }
  return { width, height, base: data, mask, light, fine, rim }
}

/** Film pattern size on the part, in preview pixels. */
export function filmTileSize(surface: Pick<Surface, "width" | "height">, filmScale: number): number {
  return Math.max(24, Math.round((Math.max(surface.width, surface.height) / 2.6) * filmScale))
}

const smooth = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}
// Gamma lookups: Math.pow per pixel is the slowest part of drawing on a phone.
const LINEAR = Float32Array.from({ length: 256 }, (_, value) => Math.pow(value / 255, 2.2))
const SRGB_STEPS = 4096
const SRGB = Uint8ClampedArray.from({ length: SRGB_STEPS + 1 }, (_, step) => Math.round(255 * Math.pow(step / SRGB_STEPS, 1 / 2.2)))
const toLinear = (value: number) => LINEAR[Math.min(255, Math.max(0, Math.round(value)))]
const toSrgb = (value: number) => SRGB[Math.round(Math.min(1, Math.max(0, value)) * SRGB_STEPS)]
const shine: Record<Lacquer, number> = { gloss: 0.5, satin: 0.22, matte: 0.06, "": 0.3 }

/** Draws a finish onto the part. Returns RGBA pixels the size of the surface. */
export function renderFinish(surface: Surface, finish: SurfaceFinish, lacquer: Lacquer, detail: number): Uint8ClampedArray {
  const { width, height, base, mask, light, fine, rim } = surface
  const out = new Uint8ClampedArray(base.length)
  const paint = finish.kind === "paint" ? finish.colour.map(toLinear) : null
  const tile = finish.kind === "film" ? finish.tile : null
  const gloss = finish.kind === "chrome" ? 0.9 : shine[lacquer]
  const detailStrength = finish.kind === "chrome" ? Math.max(detail, 0.5) * 2.6 : detail * 2.2

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x
      const p = i * 4
      const m = mask[i]
      if (m <= 0) {
        out[p] = base[p]
        out[p + 1] = base[p + 1]
        out[p + 2] = base[p + 2]
        out[p + 3] = base[p + 3]
        continue
      }

      const shade = light[i] * (0.7 + 0.3 * rim[i])
      let r: number
      let g: number
      let b: number
      if (paint) {
        r = paint[0] * shade
        g = paint[1] * shade
        b = paint[2] * shade
      } else if (tile) {
        const t = ((y % tile.height) * tile.width + (x % tile.width)) * 4
        r = toLinear(tile.data[t]) * shade
        g = toLinear(tile.data[t + 1]) * shade
        b = toLinear(tile.data[t + 2]) * shade
      } else {
        // Chrome: a studio reflection (bright sky, dark horizon, grey floor) bent by the
        // part's light and shade and its edges, repeating down the part.
        const s = (y / height) * 1.3 + (x / width) * 0.35 + (light[i] - 1) * 2.2 + (1 - rim[i]) * 0.45 + 0.2
        const f = s - Math.floor(s)
        const sky = 0.92 - f * 0.7
        const floor = 0.3 + (f - 0.5) * 0.5
        const horizon = smooth(0.4, 0.47, f) * (1 - smooth(0.5, 0.56, f))
        const v = (f < 0.47 ? sky : floor) * (1 - horizon) + 0.035 * horizon
        r = toLinear(255 * v) * 0.92
        g = toLinear(255 * v) * 0.96
        b = toLinear(255 * v)
      }

      // Highlights from the lacquer, then the photo's fine detail on top.
      const t = Math.min(1, Math.max(0, (light[i] - 1.04) / 0.4))
      const highlight = gloss * t * t * (3 - 2 * t) * rim[i] + gloss * 0.03
      const detailFactor = 1 + fine[i] * detailStrength
      r = (r + highlight) * detailFactor
      g = (g + highlight) * detailFactor
      b = (b + highlight) * detailFactor

      out[p] = base[p] * (1 - m) + toSrgb(r) * m
      out[p + 1] = base[p + 1] * (1 - m) + toSrgb(g) * m
      out[p + 2] = base[p + 2] * (1 - m) + toSrgb(b) * m
      out[p + 3] = base[p + 3]
    }
  }
  return out
}

/** "#14254d" → [20, 37, 77]; null if it isn't a hex colour. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!match) return null
  const value = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1]
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}
