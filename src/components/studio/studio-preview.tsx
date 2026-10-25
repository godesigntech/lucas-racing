"use client"

import { forwardRef, useState } from "react"
import { Box, RotateCcw } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetAngle } from "@/components/helmet-3d/helmet-scene"
import { HelmetViewer } from "@/components/helmet-3d/helmet-viewer"
import { get3dModel } from "@/lib/helmet-3d/models"
import { shellTint } from "@/lib/helmet-3d/tint"
import { getTemplateArtwork } from "@/lib/helmet-3d/templates"
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
  templateSlug: string
}

/**
 * Large live preview with an "unpaid preview" watermark. Helmets with a 3D model
 * get the 3D viewer and preset camera angles; others show the illustration.
 */
export const StudioPreview = forwardRef<HTMLDivElement, StudioPreviewProps>(function StudioPreview(
  { look, modelId, modelName, designLabel, templateSlug },
  ref,
) {
  const [view, setView] = useState<{ angle: HelmetAngle; at: number } | null>(null)
  const model3d = get3dModel(modelId)
  const artwork = getTemplateArtwork(modelId, templateSlug)
  const art = (
    <HelmetArt look={look} title={`${modelName} preview`} className="w-[82%] max-h-[20rem] animate-in fade-in-0 zoom-in-95 duration-300" />
  )

  return (
    <section
      aria-label="Helmet preview"
      className="flex flex-col overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-[radial-gradient(circle_at_50%_40%,#ffffff,#e3e2da_78%)]"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:p-7">
        <div>
          <p className="eyebrow text-muted-foreground">Live preview</p>
          <p className="mt-1 font-display text-xl font-bold uppercase sm:text-2xl">{modelName}</p>
        </div>
        <span className="hidden rounded-full border border-carbon/20 bg-card/70 px-3 py-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-wider sm:inline">
          {designLabel}
        </span>
      </div>

      <div ref={ref} className="relative grid min-w-0 flex-1 grid-cols-1 place-items-center px-6 py-1 sm:px-12 sm:py-4 lg:min-h-[22rem]">
        {model3d ? (
          <>
            {/* Kept for "Social image", which saves the illustrated design. */}
            <div className="hidden">{art}</div>
            <HelmetViewer
              url={model3d.url}
              tint={shellTint(look)}
              finish={look.finish}
              paintFinish={look.paintFinish}
              trim={look.trim}
              accessories={look.accessories}
              spoiler={look.spoiler}
              film={look.baseTexture ?? null}
              artwork={artwork}
              graphic={look.graphic}
              accent={look.accent}
              graphicFilm={look.filmTexture}
              accentFilm={look.accentTexture}
              view={view}
              label={`${modelName} in 3D with your shell colour, film, finish, accessories and spoiler`}
              fallback={art}
              className="h-[15rem] sm:h-[22rem]"
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
        <p className="flex items-center gap-2 text-xs text-muted-foreground max-sm:hidden">
          <Box className="size-3.5 text-brand-ink" aria-hidden />
          {model3d ? artwork ? "3D shows your racing lines, colours, films and accessories" : "3D shows shell and accessories; this template’s racing artwork is not available in 3D yet" : `Illustrated preview · 3D for the ${modelName} is coming soon`}
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
