"use client"

import { createClient } from "@/lib/supabase/browser"

import { colourDistance, rgbToHex } from "./colour"

export const DESIGN_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp"
const MAX_INPUT_BYTES = 15 * 1024 * 1024
const UPLOAD_MAX_SIDE = 1600
const SAMPLE_SIDE = 96

/** A message explaining why the photo can't be used, or null when it's fine. */
export function validateDesignPhoto(file: File): string | null {
  if (!DESIGN_PHOTO_ACCEPT.split(",").includes(file.type)) return "Please choose a JPG, PNG or WebP photo."
  if (file.size > MAX_INPUT_BYTES) return "That photo is over 15 MB. Please choose a smaller one."
  return null
}

export interface PreparedPhoto {
  /** Resized JPEG, ready to upload with a quote request. */
  blob: Blob
  previewUrl: string
  /** Main colours, most dominant first. */
  palette: string[]
}

function canvas(width: number, height: number) {
  const element = document.createElement("canvas")
  element.width = width
  element.height = height
  const context = element.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Canvas isn't supported in this browser.")
  return { element, context }
}

/**
 * Main colours of an image. Pixels near the centre count more (that's usually
 * where the helmet is), and near-identical shades are merged.
 */
function extractPalette(bitmap: ImageBitmap, count = 5): string[] {
  const scale = SAMPLE_SIDE / Math.max(bitmap.width, bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const { context } = canvas(width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)

  // Bucket colours to 4 bits per channel, summing a centre-weighted score and the true colour.
  // Also count how often each bucket appears around the edge and in the middle, to spot the background.
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number; edge: number; middle: number }>()
  let edgePixels = 0
  let middlePixels = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (data[offset + 3] < 128) continue
      const [r, g, b] = [data[offset], data[offset + 1], data[offset + 2]]
      const dx = x / width - 0.5
      const dy = y / height - 0.5
      const weight = 1.6 - Math.min(1.2, Math.hypot(dx, dy) * 2)
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0, edge: 0, middle: 0 }
      bucket.weight += weight
      bucket.r += r * weight
      bucket.g += g * weight
      bucket.b += b * weight
      if (Math.abs(dx) > 0.42 || Math.abs(dy) > 0.42) {
        bucket.edge += 1
        edgePixels += 1
      } else if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
        bucket.middle += 1
        middlePixels += 1
      }
      buckets.set(key, bucket)
    }
  }

  // A colour that fills the edges but is scarce in the middle is the backdrop, not the helmet,
  // so it ranks far lower. (In a close-up, the helmet's own colour fills both, so it's kept.)
  // Only the ranking changes: the colour itself is still the plain weighted average.
  const ranked = [...buckets.values()]
    .map((bucket) => {
      const edgeShare = edgePixels ? bucket.edge / edgePixels : 0
      const middleShare = middlePixels ? bucket.middle / middlePixels : 0
      const backdrop = edgeShare > 0.08 && middleShare < edgeShare * 0.5
      return {
        score: backdrop ? bucket.weight * 0.1 : bucket.weight,
        hex: rgbToHex([bucket.r / bucket.weight, bucket.g / bucket.weight, bucket.b / bucket.weight]),
      }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.hex)

  const palette: string[] = []
  for (const hex of ranked) {
    if (palette.every((picked) => colourDistance(picked, hex) > 18)) palette.push(hex)
    if (palette.length === count) break
  }
  return palette
}

/** Reads the photo's colours and makes a smaller JPEG copy for upload. */
export async function prepareDesignPhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file)
  try {
    const palette = extractPalette(bitmap)
    const scale = Math.min(1, UPLOAD_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const { element, context } = canvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale))
    context.fillStyle = "#ffffff" // transparent PNGs become white, not black, as JPEGs
    context.fillRect(0, 0, element.width, element.height)
    context.drawImage(bitmap, 0, 0, element.width, element.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      element.toBlob((result) => (result ? resolve(result) : reject(new Error("Couldn't read that photo."))), "image/jpeg", 0.85),
    )
    return { blob, previewUrl: URL.createObjectURL(blob), palette }
  } finally {
    bitmap.close()
  }
}

/** Uploads the photo to the private design-uploads bucket and returns its path. */
export async function uploadDesignPhoto(blob: Blob): Promise<string> {
  const path = `quotes/${crypto.randomUUID()}.jpg`
  const { error } = await createClient().storage.from("design-uploads").upload(path, blob, { contentType: "image/jpeg" })
  if (error) throw new Error(error.message)
  return path
}
