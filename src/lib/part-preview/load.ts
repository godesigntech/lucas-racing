// Browser side of the part preview: loads photos, masks and film tiles into pixels,
// once each, and turns a chosen finish into something renderFinish() can draw.

import type { PartFinish } from "@/lib/shop/part-finish"
import type { PriceBook } from "@/types/catalog"
import type { PartPreview } from "@/types/shop"

import { buildSurface, filmTileSize, findPartMask, hexToRgb, maskFromPixels, PREVIEW_SIZE, type Lacquer, type Pixels, type Surface, type SurfaceFinish } from "./surface"

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    // Photos may come from Supabase storage; without this the canvas can't be read.
    image.crossOrigin = "anonymous"
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("The part photo didn't load."))
    image.src = url
  })
}

/** Draws an image at a given size and reads its pixels. */
export function readPixels(image: CanvasImageSource, width: number, height: number): Pixels {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Canvas isn't supported in this browser.")
  context.drawImage(image, 0, 0, width, height)
  return { data: context.getImageData(0, 0, width, height).data, width, height }
}

/** The preview size for a photo: its own size, no larger than PREVIEW_SIZE on the long side. */
export function previewSize(image: HTMLImageElement): { width: number; height: number } {
  const natural = { width: image.naturalWidth || PREVIEW_SIZE, height: image.naturalHeight || PREVIEW_SIZE }
  const scale = Math.min(1, PREVIEW_SIZE / Math.max(natural.width, natural.height))
  return { width: Math.max(1, Math.round(natural.width * scale)), height: Math.max(1, Math.round(natural.height * scale)) }
}

const surfaces = new Map<string, Promise<Surface>>()

/** The analysed photo for a preview (cached per photo and mask). */
export function getSurface(preview: Pick<PartPreview, "image" | "mask">): Promise<Surface> {
  const key = `${preview.image}|${preview.mask ?? ""}`
  let surface = surfaces.get(key)
  if (!surface) {
    surface = (async () => {
      const photo = await loadImage(preview.image)
      const { width, height } = previewSize(photo)
      const pixels = readPixels(photo, width, height)
      const outline = findPartMask(pixels)
      const mask = preview.mask ? maskFromPixels(readPixels(await loadImage(preview.mask), width, height)) : outline
      return buildSurface(pixels, mask, outline)
    })()
    surface.catch(() => surfaces.delete(key))
    surfaces.set(key, surface)
  }
  return surface
}

const tiles = new Map<string, Promise<Pixels>>()

/** A film texture, resized so its pattern sits on the part at a believable scale. */
function getFilmTile(url: string, size: number): Promise<Pixels> {
  const key = `${url}|${size}`
  let tile = tiles.get(key)
  if (!tile) {
    tile = loadImage(url).then((image) => readPixels(image, size, size))
    tile.catch(() => tiles.delete(key))
    tiles.set(key, tile)
  }
  return tile
}

/** Turns the customer's finish into colours or a film tile for the surface. Null if it can't be shown. */
export async function surfaceFinish(
  surface: Surface,
  finish: Pick<PartFinish, "type" | "value">,
  priceBook: Pick<PriceBook, "films">,
  filmScale: number,
): Promise<SurfaceFinish | null> {
  if (finish.type === "chrome") return { kind: "chrome" }
  if (finish.type === "paint") {
    const colour = hexToRgb(finish.value)
    return colour ? { kind: "paint", colour } : null
  }
  const film = priceBook.films.find((item) => item.id === finish.value)
  if (!film?.textureUrl) return null
  return { kind: "film", tile: await getFilmTile(film.textureUrl, filmTileSize(surface, filmScale)) }
}

export const toLacquer = (finish: Pick<PartFinish, "type" | "lacquer">): Lacquer =>
  finish.type === "chrome" ? "" : finish.lacquer === "gloss" || finish.lacquer === "satin" || finish.lacquer === "matte" ? finish.lacquer : "gloss"
