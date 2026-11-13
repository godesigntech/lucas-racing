"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { getSurface, surfaceFinish, toLacquer } from "@/lib/part-preview/load"
import { renderFinish } from "@/lib/part-preview/surface"
import type { PartFinish } from "@/lib/shop/part-finish"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { PartPreview } from "@/types/shop"

interface PartPreviewCanvasProps {
  preview: PartPreview
  /** The finish to show; null shows the photo as it is. */
  finish: PartFinish | null
  priceBook: Pick<PriceBook, "films">
  /** Read out to screen readers, e.g. "Stub axle in Race red, gloss". */
  label: string
  className?: string
  /** Called with the canvas after each redraw (the customiser mirrors it into a mini preview). */
  onDrawn?: (canvas: HTMLCanvasElement) => void
}

/**
 * A part photo with the chosen paint, hydro-dip film or chrome drawn onto its finished
 * area, keeping the outline, holes, shading and detail. Redraws as the finish changes.
 */
export function PartPreviewCanvas({ preview, finish, priceBook, label, className, onDrawn }: PartPreviewCanvasProps) {
  const drawnCallback = useRef(onDrawn)
  useEffect(() => {
    drawnCallback.current = onDrawn
  })
  const canvas = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading")
  const { image, mask, detail, filmScale } = preview
  const type = finish?.type
  const value = finish?.value
  const lacquer = finish?.lacquer

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const surface = await getSurface({ image, mask })
        const target = canvas.current
        if (cancelled || !target) return
        const context = target.getContext("2d")
        if (!context) throw new Error("No canvas")
        let pixels = surface.base
        if (type && value !== undefined) {
          const drawn = await surfaceFinish(surface, { type, value }, priceBook, filmScale)
          if (cancelled) return
          if (drawn) pixels = renderFinish(surface, drawn, toLacquer({ type, lacquer: lacquer ?? "" }), detail)
        }
        target.width = surface.width
        target.height = surface.height
        context.putImageData(new ImageData(new Uint8ClampedArray(pixels), surface.width, surface.height), 0, 0)
        setStatus("ready")
        drawnCallback.current?.(target)
      } catch {
        if (!cancelled) setStatus("failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [image, mask, detail, filmScale, type, value, lacquer, priceBook])

  return (
    <div className={cn("relative", className)}>
      {status === "failed" ? (
        // eslint-disable-next-line @next/next/no-img-element -- fallback when the preview can't be drawn
        <img src={image} alt={label} className="block size-full object-contain" />
      ) : (
        <canvas ref={canvas} role="img" aria-label={label} className={cn("block size-full object-contain transition-opacity", status === "loading" && "opacity-0")} />
      )}
      {status === "loading" && (
        <span className="absolute inset-0 grid place-items-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-hidden />
          <span className="sr-only">Loading the preview</span>
        </span>
      )}
    </div>
  )
}
