import { CanvasTexture, LinearFilter, NoColorSpace, SRGBColorSpace } from "three"

import type { LogoPlacementItem, PersonalItem } from "@/types/configurator"

import { DECAL_SIZE, type DecalFace, faceFor, itemCentre, QUADRANT } from "@/lib/helmet-3d/decal-layout"
import { findFlag } from "@/lib/helmet-3d/flags"

import { canvasFont } from "./helmet-fonts"

/**
 * Textures the helmet shader needs, built in the browser from the customer's build.
 *
 * Two problems are solved here.
 *
 * 1. The shader used to carry exactly two masks — "graphic" and "accent" — so a template
 *    could only ever have three areas. Region masks are now packed one per channel of a
 *    single RGBA texture, so a template can have a shell plus up to four separately
 *    editable areas, each with its own colour, material and film.
 *
 * 2. Names, numbers and logos were captured at checkout but never appeared on the
 *    helmet. They're drawn here into one atlas, which the shader projects flat onto the
 *    shell from four directions. That needs no knowledge of the model's UV layout, so it
 *    works on any helmet we're given.
 */

/**
 * Non-shell regions the shader can carry: one per colour channel of the region map.
 *
 * Three per texture, not four: a 2D canvas stores premultiplied alpha, so packing a mask
 * into the alpha channel would wipe out the colour channels wherever that mask is empty.
 * Two textures give six areas beyond the shell: a designer's colour zones plus racing lines.
 */
export const MAX_REGIONS = 6
const REGIONS_PER_TEXTURE = 3

/** Films are shared between regions, so the shader only ever needs this many film textures. */
export const MAX_REGION_FILMS = 4


const REGION_SIZE = 2048

const maskCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = maskCache.get(url)
  if (cached) return cached
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${url}`))
    image.src = url
  })
  maskCache.set(url, promise)
  return promise
}

function canvas2d(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas 2D is not available")
  return { canvas, ctx }
}

/**
 * Packs up to four greyscale masks into the channels of one texture: region 1 in red,
 * region 2 in green, and so on. The shell is whatever no mask covers.
 *
 * Masks are authored against the model's UVs, so this texture is sampled in UV space,
 * exactly as the two old masks were.
 */
export async function buildRegionMap(maskUrls: (string | null)[]): Promise<CanvasTexture[] | null> {
  const urls = maskUrls.slice(0, MAX_REGIONS)
  if (!urls.some(Boolean)) return null

  const images = await Promise.all(urls.map((url) => (url ? loadImage(url).catch(() => null) : null)))
  if (!images.some(Boolean)) return null

  const textures: CanvasTexture[] = []
  for (let start = 0; start < images.length; start += REGIONS_PER_TEXTURE) {
    textures.push(packRegions(images.slice(start, start + REGIONS_PER_TEXTURE)))
  }
  return textures
}

/** Up to three masks in one texture's red, green and blue channels. */
function packRegions(images: (HTMLImageElement | null)[]): CanvasTexture {

  const { canvas, ctx } = canvas2d(REGION_SIZE)
  const packed = ctx.createImageData(REGION_SIZE, REGION_SIZE)
  const scratch = canvas2d(REGION_SIZE)

  images.forEach((image, index) => {
    if (!image) return
    scratch.ctx.clearRect(0, 0, REGION_SIZE, REGION_SIZE)
    scratch.ctx.drawImage(image, 0, 0, REGION_SIZE, REGION_SIZE)
    const data = scratch.ctx.getImageData(0, 0, REGION_SIZE, REGION_SIZE).data
    // The masks are greyscale, so the red channel is the coverage.
    for (let pixel = 0; pixel < data.length; pixel += 4) {
      packed.data[pixel + index] = data[pixel]
    }
  })
  // Fully opaque, so the canvas doesn't premultiply the coverage away.
  for (let pixel = 3; pixel < packed.data.length; pixel += 4) packed.data[pixel] = 255
  ctx.putImageData(packed, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = NoColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}


/** Web fonts load on demand: wait for this one so the helmet never shows a stand-in font. */
async function ensureFont(font: string, text: string) {
  if (typeof document === "undefined" || !document.fonts) return
  await document.fonts.load(font, text).catch(() => undefined)
}



export interface DecalInput {
  personalisation: PersonalItem[]
  logos: LogoPlacementItem[]
  /** Signed URLs for the customer's uploaded logos, keyed by storage path. */
  logoUrls: Record<string, string>
  /** Used when a piece of text has no colour of its own. */
  defaultColour: string
}

/**
 * Draws every name, number and logo into one atlas: four quadrants, one per direction
 * the shader projects from. Returns null when there's nothing to draw, so the shader can
 * skip the whole decal branch.
 */
export async function buildDecalAtlas(input: DecalInput): Promise<CanvasTexture | null> {
  const texts = input.personalisation.filter((item) => item.value.trim() !== "")
  const logos = input.logos.filter((item) => input.logoUrls[item.path])
  if (texts.length === 0 && logos.length === 0) return null

  const { canvas, ctx } = canvas2d(DECAL_SIZE)
  ctx.clearRect(0, 0, DECAL_SIZE, DECAL_SIZE)

  // Stack several items on the same face rather than letting them overlap.
  const used: Record<DecalFace, number> = { sides: 0, front: 0, back: 0, top: 0 }

  for (const item of texts) {
    const face = faceFor(item.position)
    const [centreX, centreY] = itemCentre(face, used[face]++, item.offsetX, item.offsetY)
    const size = QUADRANT * 0.14 * (item.scale ?? 1)

    if (item.kind === "flag") {
      const country = findFlag(item.value)
      const image = country ? await loadImage(country.url).catch(() => null) : null
      if (!image) continue
      // Flags are drawn at 4:3, about as tall as a line of lettering.
      const height = size * 1.1
      ctx.save()
      ctx.translate(centreX, centreY)
      ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180)
      ctx.drawImage(image, (-height * 4) / 6, -height / 2, (height * 4) / 3, height)
      ctx.restore()
      continue
    }

    const text = item.value
    const font = canvasFont(item.font, size, { bold: item.bold, italic: item.italic })
    await ensureFont(font, text)

    ctx.save()
    ctx.translate(centreX, centreY)
    ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180)
    ctx.font = font
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    // Letter spacing is a newer canvas feature; browsers without it just draw normal spacing.
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${((item.letterSpacing ?? 0) * size).toFixed(1)}px`
    const outlineWidth = (item.outlineWidth ?? 0) * size
    if (item.outline && outlineWidth > 0) {
      // Drawn first and twice as wide, so the fill covers the inner half and the outline sits outside the letters.
      ctx.lineJoin = "round"
      ctx.lineWidth = outlineWidth * 2
      ctx.strokeStyle = item.outline
      ctx.strokeText(text, 0, 0, QUADRANT * 0.62)
    }
    ctx.fillStyle = item.colour ?? input.defaultColour
    ctx.fillText(text, 0, 0, QUADRANT * 0.62)
    ctx.restore()
  }

  for (const item of logos) {
    const image = await loadImage(input.logoUrls[item.path]).catch(() => null)
    if (!image) continue
    const face = faceFor(item.position)
    const [centreX, centreY] = itemCentre(face, used[face]++, item.offsetX, item.offsetY)
    const width = QUADRANT * 0.3 * (item.scale ?? 1)
    const height = (width * image.height) / (image.width || 1)

    ctx.save()
    ctx.translate(centreX, centreY)
    ctx.rotate(((item.rotation ?? 0) * Math.PI) / 180)
    ctx.drawImage(image, -width / 2, -height / 2, width, height)
    ctx.restore()
  }

  const texture = new CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
