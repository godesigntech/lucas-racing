"use client"

import { forwardRef, useState } from "react"
import { Box, RotateCcw } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetView } from "@/components/helmet/helmet-geometry"
import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

const views: { view: HelmetView; label: string }[] = [
  { view: "full", label: "Side" },
  { view: "crown", label: "Crown" },
  { view: "visor", label: "Visor" },
  { view: "decal", label: "Number" },
]

interface StudioPreviewProps {
  look: HelmetLook
  modelName: string
  designLabel: string
}

/** Large live preview with view switcher and an "unpaid preview" watermark. */
export const StudioPreview = forwardRef<HTMLDivElement, StudioPreviewProps>(function StudioPreview(
  { look, modelName, designLabel },
  ref,
) {
  const [view, setView] = useState<HelmetView>("full")

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
        <span className="rounded-full border border-carbon/20 bg-card/70 px-3 py-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-wider">
          {designLabel}
        </span>
      </div>

      <div ref={ref} className="relative grid flex-1 place-items-center px-6 py-4 sm:px-12 lg:min-h-[22rem]">
        <HelmetArt
          key={view}
          look={look}
          view={view}
          title={`${modelName} preview, ${views.find((item) => item.view === view)?.label} view`}
          className="w-[82%] max-h-[20rem] animate-in fade-in-0 zoom-in-95 duration-300"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden font-display text-3xl font-bold uppercase tracking-[0.3em] text-carbon/[0.07] sm:text-4xl"
        >
          <span className="-rotate-[18deg] whitespace-nowrap">Lucas Racing / Unpaid preview</span>
        </span>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Box className="size-3.5 text-lime-ink" aria-hidden />
          Illustrated preview · 3D builder coming soon
        </p>
        <div role="group" aria-label="Preview view" className="flex items-center gap-1 self-start rounded-xl bg-card p-1 shadow-sm ring-1 ring-carbon/10 sm:self-auto">
          {views.map((item) => (
            <button
              key={item.view}
              type="button"
              aria-pressed={view === item.view}
              onClick={() => setView(item.view)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === item.view ? "bg-carbon text-paper" : "text-muted-foreground hover:text-carbon",
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView("full")}
            aria-label="Reset view"
            className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-carbon"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-carbon/10 bg-card/40 px-5 py-3 sm:px-7">
        <p className="eyebrow text-[0.65rem] text-muted-foreground">01 / Your helmet, every angle</p>
        <button type="button" onClick={() => setView("full")} className="text-xs font-medium text-muted-foreground hover:text-carbon">
          Reset view
        </button>
      </div>
    </section>
  )
})
