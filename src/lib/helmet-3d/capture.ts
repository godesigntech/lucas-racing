// A type only: the scene itself stays in its own lazily loaded chunk.
import type { HelmetAngle } from "@/components/helmet-3d/helmet-scene"

/** A PNG of the helmet from that angle (transparent background), or null before it's ready. */
type HelmetCapture = (angle: HelmetAngle) => string | null

/** Each 3D preview's canvas, and how to photograph its helmet. The scene registers itself. */
const captures = new WeakMap<HTMLCanvasElement, HelmetCapture>()

export function registerHelmetCapture(canvas: HTMLCanvasElement, capture: HelmetCapture): () => void {
  captures.set(canvas, capture)
  return () => {
    if (captures.get(canvas) === capture) captures.delete(canvas)
  }
}

const BACKGROUND = "#efeee8"

/**
 * Pictures of the helmet in the 3D preview inside `container`, one per angle, as JPEGs on
 * a light studio background. Empty when there's no preview (or it hasn't loaded).
 */
export async function captureHelmetViews(container: Element | null, angles: readonly HelmetAngle[]): Promise<Blob[]> {
  const canvas = container?.querySelector("canvas")
  const capture = canvas ? captures.get(canvas) : undefined
  if (!capture) return []
  const blobs: Blob[] = []
  for (const angle of angles) {
    const png = capture(angle)
    if (!png) continue
    const image = new Image()
    image.src = png
    await image.decode()
    const out = document.createElement("canvas")
    out.width = image.naturalWidth
    out.height = image.naturalHeight
    const context = out.getContext("2d")
    if (!context) continue
    context.fillStyle = BACKGROUND
    context.fillRect(0, 0, out.width, out.height)
    context.drawImage(image, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.88))
    if (blob) blobs.push(blob)
  }
  return blobs
}
