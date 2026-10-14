"use client"

import dynamic from "next/dynamic"
import { Pause, Play, RotateCcw } from "lucide-react"
import { useState } from "react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

import type { HelmetCameraView } from "./helmet-3d-viewer"

// Three.js only runs in the browser, so the viewer is never prerendered.
const Helmet3DViewer = dynamic(() => import("./helmet-3d-viewer").then((m) => m.Helmet3DViewer), { ssr: false })

const VIEWS: { id: HelmetCameraView; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "rear", label: "Rear" },
  { id: "top", label: "Top" },
]

interface Helmet3DProps {
  look: HelmetLook
  /** Accessible description of the preview. */
  title: string
  /** Show view buttons, auto-rotate and reset. */
  controls?: boolean
  autoRotate?: boolean
  /** Tone of the overlaid controls. */
  tone?: "light" | "dark"
  className?: string
}

/** 3D helmet preview with the illustration as a poster while the model loads. */
export function Helmet3D({ look, title, controls = false, autoRotate = false, tone = "light", className }: Helmet3DProps) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [view, setView] = useState<HelmetCameraView>("three-quarter")
  const [viewKey, setViewKey] = useState(0)
  const [spinning, setSpinning] = useState(autoRotate)

  const goTo = (next: HelmetCameraView) => {
    setView(next)
    setViewKey((k) => k + 1)
    setSpinning(false)
  }

  const chip = cn(
    "rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3",
    tone === "dark" ? "bg-white/10 text-paper hover:bg-white/20" : "bg-carbon/5 text-carbon hover:bg-carbon/10",
  )

  return (
    <div className={cn("relative", className)} role="group" aria-label={title}>
      {!failed && (
        <Helmet3DViewer
          look={look}
          view={view}
          viewKey={viewKey}
          autoRotate={spinning}
          className={cn("transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")}
          onReady={() => setReady(true)}
          onError={(error) => setFailed(error.message)}
        />
      )}

      {(!ready || failed) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <HelmetArt look={look} className={cn("max-h-full", !failed && "animate-pulse")} />
        </div>
      )}

      {controls && ready && !failed && (
        <div className="absolute inset-x-2 bottom-3 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" className={chip} onClick={() => goTo(item.id)} aria-pressed={view === item.id}>
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={cn(chip, "inline-flex items-center gap-1")}
            onClick={() => setSpinning((s) => !s)}
            aria-pressed={spinning}
          >
            {spinning ? <Pause className="size-3" aria-hidden /> : <Play className="size-3" aria-hidden />}
            Rotate
          </button>
          <button type="button" className={cn(chip, "inline-flex items-center gap-1")} onClick={() => goTo("three-quarter")}>
            <RotateCcw className="size-3" aria-hidden />
            Reset
          </button>
        </div>
      )}

      {failed && (
        <p className="absolute inset-x-0 bottom-2 text-center text-xs text-muted-foreground">
          {failed} Showing the illustrated preview.
        </p>
      )}
    </div>
  )
}
