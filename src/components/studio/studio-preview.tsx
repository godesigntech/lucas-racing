"use client"

import { forwardRef, useState } from "react"
import { Box, RotateCcw } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetView } from "@/components/helmet/helmet-geometry"
import { HelmetViewer } from "@/components/helmet-3d/helmet-viewer"
import { get3dModel } from "@/lib/helmet-3d/models"
import { shellTint } from "@/lib/helmet-3d/tint"
import { cn } from "@/lib/utils"
import type { HelmetLook, HelmetModelId } from "@/types/helmet"

type PreviewView = HelmetView | "3d"

const views: { view: HelmetView; label: string }[] = [
  { view: "full", label: "Side" },
  { view: "crown", label: "Crown" },
  { view: "visor", label: "Visor" },
  { view: "decal", label: "Number" },
]

interface StudioPreviewProps {
  look: HelmetLook
  modelId: HelmetModelId
  modelName: string
  designLabel: string
}

/** Large live preview with view switcher and an "unpaid preview" watermark. */
export const StudioPreview = forwardRef<HTMLDivElement, StudioPreviewProps>(function StudioPreview(
  { look, modelId, modelName, designLabel },
  ref,
) {
  // Opens in 3D when the helmet has a model; otherwise the illustration.
  const [selected, setSelected] = useState<PreviewView>("3d")
  const model3d = get3dModel(modelId)
  // Switching to a helmet without a 3D model drops back to the illustration.
  const view: PreviewView = selected === "3d" && !model3d ? "full" : selected
  const art = (
    <HelmetArt
      key={view}
      look={look}
      view={view === "3d" ? "full" : view}
      title={`${modelName} preview, ${views.find((item) => item.view === view)?.label ?? "side"} view`}
      className="w-[82%] max-h-[20rem] animate-in fade-in-0 zoom-in-95 duration-300"
    />
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
        {view === "3d" && model3d ? (
          <>
            {/* Kept for "Download image", which saves the illustrated design. */}
            <div className="hidden">{art}</div>
            <HelmetViewer
              url={model3d.url}
              tint={shellTint(look)}
              finish={look.finish}
              film={look.filmTexture ?? null}
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
          {view === "3d" ? "3D preview of your colour, finish and film" : model3d ? "Tap 3D to turn the real helmet" : "Illustrated preview · 3D coming soon"}
        </p>
        <div role="group" aria-label="Preview view" className="flex max-w-full items-center gap-1 self-stretch overflow-x-auto rounded-xl bg-card p-1 shadow-sm ring-1 ring-carbon/10 sm:self-auto">
          {model3d && (
            <button
              type="button"
              aria-pressed={view === "3d"}
              onClick={() => setSelected("3d")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-3",
                view === "3d" ? "bg-lime text-carbon" : "text-carbon hover:bg-lime/30",
              )}
            >
              <Box className="size-3.5" aria-hidden /> 3D
            </button>
          )}
          {views.map((item) => (
            <button
              key={item.view}
              type="button"
              aria-pressed={view === item.view}
              onClick={() => setSelected(item.view)}
              className={cn(
                "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-3",
                view === item.view ? "bg-carbon text-paper" : "text-muted-foreground hover:text-carbon",
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected(model3d ? "3d" : "full")}
            aria-label="Reset view"
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-carbon"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

    </section>
  )
})
