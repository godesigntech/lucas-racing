"use client"

import { forwardRef, useState } from "react"
import { Box, RotateCcw } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetAngle } from "@/components/helmet-3d/helmet-scene"
import { HelmetViewer } from "@/components/helmet-3d/helmet-viewer"
import { get3dModel } from "@/lib/helmet-3d/models"
import { shellTint } from "@/lib/helmet-3d/tint"
import { cn } from "@/lib/utils"
import type { HelmetLook, HelmetModelId } from "@/types/helmet"

const angles: { angle: HelmetAngle; label: string }[] = [
  { angle: "angle", label: "¾" },
  { angle: "front", label: "Front" },
  { angle: "side", label: "Side" },
  { angle: "back", label: "Back" },
  { angle: "top", label: "Top" },
]

interface StudioPreviewProps {
  look: HelmetLook
  modelId: HelmetModelId
  modelName: string
  designLabel: string
}

/**
 * Large live preview with an "unpaid preview" watermark. Helmets with a 3D model
 * get the 3D viewer and preset camera angles; others show the illustration.
 */
export const StudioPreview = forwardRef<HTMLDivElement, StudioPreviewProps>(function StudioPreview(
  { look, modelId, modelName, designLabel },
  ref,
) {
  const [view, setView] = useState<{ angle: HelmetAngle; at: number } | null>(null)
  const model3d = get3dModel(modelId)
  const art = (
    <HelmetArt look={look} title={`${modelName} preview`} className="w-[82%] max-h-[20rem] animate-in fade-in-0 zoom-in-95 duration-300" />
  )

  return (
    <section
      aria-label="Helmet preview"
      className="flex flex-col overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-[radial-gradient(circle_at_50%_40%,#ffffff,#e3e2da_78%)]"
    >
      <div className="flex items-start justify-between gap-4 p-5 sm:p-7">
        <div>
          <p className="eyebrow text-muted-foreground">Live preview</p>
          <p className="mt-1 font-display text-2xl font-bold uppercase">{modelName}</p>
        </div>
        <span className="hidden rounded-full border border-carbon/20 bg-card/70 px-3 py-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-wider sm:inline">
          {designLabel}
        </span>
      </div>

      <div ref={ref} className="relative grid flex-1 place-items-center px-6 py-4 sm:px-12 lg:min-h-[22rem]">
        {model3d ? (
          <>
            {/* Kept for "Social image", which saves the illustrated design. */}
            <div className="hidden">{art}</div>
            <HelmetViewer
              url={model3d.url}
              tint={shellTint(look)}
              finish={look.finish}
              film={look.filmTexture ?? null}
              view={view}
              label={`${modelName} in 3D with your colour, finish and film`}
              fallback={art}
              className="h-[20rem] sm:h-[22rem]"
            />
          </>
        ) : (
          art
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden font-display text-3xl font-bold uppercase tracking-[0.3em] text-carbon/[0.07] sm:text-4xl"
        >
          <span className="-rotate-[18deg] whitespace-nowrap">Lucas Racing / Unpaid preview</span>
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-5">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Box className="size-3.5 text-lime-ink" aria-hidden />
          {model3d ? "3D preview of your colour, finish and film" : `Illustrated preview · 3D for the ${modelName} is coming soon`}
        </p>
        {model3d && (
          <div
            role="group"
            aria-label="Camera angle"
            className="flex max-w-full items-center gap-1 self-stretch overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-carbon/10 sm:self-auto"
          >
            {angles.map((item) => (
              <button
                key={item.angle}
                type="button"
                aria-pressed={view?.angle === item.angle}
                aria-label={item.angle === "angle" ? "Three-quarter view" : `${item.label} view`}
                onClick={() => setView({ angle: item.angle, at: Date.now() })}
                className={cn(
                  "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-3",
                  view?.angle === item.angle ? "bg-carbon text-paper" : "text-muted-foreground hover:text-carbon",
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setView({ angle: "angle", at: Date.now() })}
              aria-label="Reset view"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-carbon"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
})
