"use client"

import { useState } from "react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import type { HelmetView } from "@/components/helmet/helmet-geometry"
import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

const views: { view: HelmetView; label: string }[] = [
  { view: "full", label: "Side profile" },
  { view: "crown", label: "Crown detail" },
  { view: "visor", label: "Visor and trim" },
  { view: "decal", label: "Number panel" },
]

interface ProductGalleryProps {
  look: HelmetLook
  name: string
}

export function ProductGallery({ look, name }: ProductGalleryProps) {
  const [active, setActive] = useState<HelmetView>("full")
  const activeLabel = views.find((item) => item.view === active)?.label ?? ""

  return (
    <div className="space-y-4">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem] border border-carbon/10 bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e3e2da_75%)] p-6 sm:p-10">
        <HelmetArt key={active} look={look} view={active} title={`${name}: ${activeLabel}`} className="max-h-full animate-in fade-in-0 zoom-in-95 duration-300" />
        <span className="absolute bottom-4 left-4 rounded-full bg-carbon/85 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wider text-paper">
          {activeLabel}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3" role="group" aria-label="Choose a view">
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
