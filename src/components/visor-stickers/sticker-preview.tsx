"use client"

import { useEffect, useRef } from "react"

import { helmetFontStyles } from "@/components/helmet-3d/helmet-fonts"
import { brandedStickerUrl, findStickerDesign, recolouredSticker, stickerColours } from "@/lib/helmet-3d/sticker-designs"
import type { VisorStrip } from "@/types/configurator"

const WIDTH = 1200
const LOWER_URL = "/stickers/lucas-racing-visor-lower.webp?v=1"
/** The bottom strip is printed at this share of the top band's width (the client's artwork). */
const LOWER_SHARE = 0.54
const GAP = 34

function load(src: string): Promise<HTMLImageElement | null> {
  const image = new Image()
  image.src = src
  return image
    .decode()
    .then(() => image)
    .catch(() => null)
}

/** The shape of an image, filled with one colour. */
function silhouette(image: HTMLImageElement, width: number, height: number, colour: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")!
  context.drawImage(image, 0, 0, width, height)
  context.globalCompositeOperation = "source-in"
  context.fillStyle = colour
  context.fillRect(0, 0, width, height)
  return canvas
}

/** Where the band is solid down the middle: lettering is centred there, inside the band. */
function bandMiddle(canvas: HTMLCanvasElement): { centre: number; depth: number } {
  const context = canvas.getContext("2d", { willReadFrequently: true })!
  const x = Math.floor(canvas.width / 2)
  const { data } = context.getImageData(x, 0, 1, canvas.height)
  let top = -1
  let bottom = -1
  for (let y = 0; y < canvas.height; y++) {
    if (data[y * 4 + 3] > 40) {
      if (top < 0) top = y
      bottom = y
    } else if (top >= 0) break
  }
  if (top < 0) return { centre: canvas.height / 2, depth: canvas.height }
  return { centre: (top + bottom) / 2, depth: bottom - top }
}

async function letter(context: CanvasRenderingContext2D, text: string, strip: VisorStrip, x: number, y: number, size: number, maxWidth: number) {
  const style = helmetFontStyles.find((item) => item.id === strip.font) ?? helmetFontStyles[0]
  const font = (px: number) => `${style.italic ? "italic " : ""}${style.weight} ${px}px ${style.family}`
  if (document.fonts) await document.fonts.load(font(size), text).catch(() => undefined)
  context.font = font(size)
  const width = context.measureText(text).width
  if (width > maxWidth) context.font = font(size * (maxWidth / width))
  context.fillStyle = strip.textColour ?? "#ffffff"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, x, y)
}

/**
 * The whole sticker laid flat, in the chosen helmet's shape: the top band (Lucas Racing, or
 * a design in the customer's colours) with their text inside it, and the bottom strip
 * underneath with its text.
 */
export function StickerPreview({ strip, model }: { strip: VisorStrip; model: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const key = JSON.stringify({ strip, model })

  useEffect(() => {
    let cancelled = false
    const draw = async () => {
      const current = JSON.parse(key) as { strip: VisorStrip; model: string }
      const sticker = current.strip
      const design = sticker.enabled ? findStickerDesign(sticker.design) : undefined
      const branded = await load(brandedStickerUrl(current.model))
      const lower = await load(LOWER_URL)
      const art = design ? await load(await recolouredSticker(design, sticker.designColours, current.model)) : null
      if (cancelled || !branded || !lower) return

      // The top band: the Lucas Racing sticker, the design, or the band's shape in one colour.
      const topSource = art ?? branded
      const topHeight = Math.round((WIDTH * topSource.naturalHeight) / topSource.naturalWidth)
      let top: HTMLCanvasElement
      if (!sticker.enabled || art) {
        top = document.createElement("canvas")
        top.width = WIDTH
        top.height = topHeight
        top.getContext("2d")!.drawImage(topSource, 0, 0, WIDTH, topHeight)
      } else {
        top = silhouette(branded, WIDTH, topHeight, sticker.colour)
      }

      // The bottom strip: lucasracing.co.uk, or the same shape in the sticker's main colour.
      const lowerWidth = Math.round(WIDTH * LOWER_SHARE)
      const lowerHeight = Math.round((lowerWidth * lower.naturalHeight) / lower.naturalWidth)
      const main = design ? (stickerColours(design, sticker.designColours)[design.parts[0]?.key ?? ""] ?? sticker.colour) : sticker.colour
      const bottom = sticker.enabled ? silhouette(lower, lowerWidth, lowerHeight, main) : null

      const canvas = ref.current
      if (!canvas) return
      canvas.width = WIDTH
      canvas.height = topHeight + GAP + lowerHeight
      const context = canvas.getContext("2d")!
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(top, 0, 0)
      if (bottom) context.drawImage(bottom, (WIDTH - lowerWidth) / 2, topHeight + GAP)
      else context.drawImage(lower, (WIDTH - lowerWidth) / 2, topHeight + GAP, lowerWidth, lowerHeight)

      if (sticker.enabled) {
        const text = sticker.text.trim()
        if (text) {
          const band = bandMiddle(top)
          await letter(context, text, sticker, WIDTH / 2, band.centre, band.depth * 0.62, WIDTH * 0.42)
        }
        const bottomText = (sticker.bottomText ?? "").trim()
        if (bottomText) await letter(context, bottomText, sticker, WIDTH / 2, topHeight + GAP + lowerHeight / 2, lowerHeight * 0.62, lowerWidth * 0.78)
      }
    }
    void draw()
    return () => {
      cancelled = true
    }
  }, [key])

  return (
    <div className="grid aspect-[16/7] place-items-center rounded-3xl bg-[radial-gradient(circle_at_50%_40%,#ffffff,#e6e5df_85%)] p-6 ring-1 ring-carbon/10">
      <canvas ref={ref} aria-label="Your visor sticker, top band and bottom strip" role="img" className="h-auto max-h-full w-full" />
    </div>
  )
}
