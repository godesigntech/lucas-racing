"use client"

import { useState } from "react"
import { Box } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetView } from "@/components/helmet/helmet-geometry"
import { HelmetViewer } from "@/components/helmet-3d/helmet-viewer"
import { first3dModel } from "@/lib/helmet-3d/models"
import { shellTint } from "@/lib/helmet-3d/tint"
import { cn } from "@/lib/utils"
import type { HelmetLook, HelmetModelId } from "@/types/helmet"

type GalleryView = HelmetView | "3d"

const views: { view: HelmetView; label: string }[] = [
  { view: "full", label: "Side profile" },
  { view: "crown", label: "Crown detail" },
  { view: "visor", label: "Visor and trim" },
  { view: "decal", label: "Number panel" },
]

interface ProductGalleryProps {
  look: HelmetLook
  name: string
  /** Helmets this design is offered on; the first with a 3D model gets a 3D view. */
  models: HelmetModelId[]
}

export function ProductGallery({ look, name, models }: ProductGalleryProps) {
  const [active, setActive] = useState<GalleryView>("full")
  const model3d = first3dModel(models)
  const activeLabel = active === "3d" ? "3D · drag to turn" : (views.find((item) => item.view === active)?.label ?? "")
  const fullArt = <HelmetArt look={look} title={`${name}: side profile`} className="max-h-full" />

  return (
    <div className="space-y-4">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem] border border-carbon/10 bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e3e2da_75%)] p-6 sm:p-10">
        {active === "3d" && model3d ? (
          <HelmetViewer
            url={model3d.model.url}
            tint={shellTint(look)}
            finish={look.finish}
            label={`${name} helmet in 3D, showing the shell colour and finish`}
            fallback={fullArt}
            className="absolute inset-0"
          />
        ) : (
          <HelmetArt
            key={active}
            look={look}
            view={active === "3d" ? "full" : active}
            title={`${name}: ${activeLabel}`}
            className="max-h-full animate-in fade-in-0 zoom-in-95 duration-300"
          />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-carbon/85 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wider text-paper">
          {activeLabel}
        </span>
      </div>
      <div className={cn("grid gap-3", model3d ? "grid-cols-5" : "grid-cols-4")} role="group" aria-label="Choose a view">
        {model3d && (
          <button
            type="button"
            onClick={() => setActive("3d")}
            aria-pressed={active === "3d"}
            aria-label="3D view"
            className={cn(
              "grid aspect-square place-items-center content-center gap-1 overflow-hidden rounded-2xl border p-2 text-xs font-bold uppercase transition-[border-color,box-shadow]",
              active === "3d" ? "border-carbon bg-lime text-carbon ring-2 ring-carbon" : "border-carbon/10 bg-lime/30 hover:border-carbon/40",
            )}
          >
            <Box className="size-6" aria-hidden />
            3D
          </button>
        )}
        {views.map((item) => {
          const selected = item.view === active
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActive(item.view)}
              aria-pressed={selected}
              aria-label={item.label}
              className={cn(
                "grid aspect-square place-items-center overflow-hidden rounded-2xl border bg-card p-2 transition-[border-color,box-shadow]",
                selected ? "border-carbon ring-2 ring-carbon" : "border-carbon/10 hover:border-carbon/40",
              )}
            >
              <HelmetArt look={look} view={item.view} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
