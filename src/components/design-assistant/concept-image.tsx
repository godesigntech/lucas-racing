"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Maximize2, RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { requestConceptImage } from "@/lib/actions/design-assistant"
import type { ConceptImageValues } from "@/lib/validations/design-assistant"

export type ConceptImageState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "done"; image: string }
  | { status: "error"; message: string }

/**
 * Paints an AI concept image. The server answers once the picture is ready.
 * Each request counts towards the visitor's hourly limit (checked on the server).
 */
export function useConceptImage() {
  const [state, setState] = useState<ConceptImageState>({ status: "idle" })
  const run = useRef(0)

  // Ignore a late answer once the assistant has closed.
  useEffect(() => () => void (run.current += 1), [])

  const start = useCallback(async (request: ConceptImageValues) => {
    const id = ++run.current
    setState({ status: "working" })
    try {
      const result = await requestConceptImage(request)
      if (id !== run.current) return
      if (result.ok && result.data) return setState({ status: "done", image: result.data.image })
      setState({ status: "error", message: result.ok ? "The AI couldn't finish your concept." : result.message })
    } catch {
      if (id === run.current) setState({ status: "error", message: "Something went wrong. Check your connection and try again." })
    }
  }, [])

  const reset = useCallback(() => {
    run.current += 1
    setState({ status: "idle" })
  }, [])

  return { state, start, reset }
}

/** The AI concept image: a painting animation while it works, then the picture. */
export function ConceptImage({ state, onRetry }: { state: ConceptImageState; onRetry: () => void }) {
  if (state.status === "idle") return null
  return (
    <figure className="overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card">
      <div className={cn("relative aspect-square", state.status === "done" ? "bg-[#f4f3ef]" : "bg-carbon")}>
        {state.status === "done" ? (
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="group block size-full cursor-zoom-in" aria-label="View the AI concept full size">
                {/* Contained, never cropped: the picture can be square, landscape or portrait. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- generated image held in memory as a data URL */}
                <img src={state.image} alt="AI concept of your custom helmet" className="size-full object-contain" />
                <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-carbon/70 text-paper opacity-80 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-4" aria-hidden />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[min(92vw,64rem)] p-3 sm:max-w-[min(92vw,64rem)]">
              <DialogTitle className="sr-only">Your AI helmet concept</DialogTitle>
              <DialogDescription className="sr-only">The full-size AI concept of your helmet.</DialogDescription>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated image held in memory as a data URL */}
              <img src={state.image} alt="AI concept of your custom helmet, full size" className="mx-auto max-h-[82vh] w-auto max-w-full rounded-xl object-contain" />
            </DialogContent>
          </Dialog>
        ) : state.status === "working" ? (
          <div className="absolute inset-0 grid place-items-center overflow-hidden">
            <div aria-hidden className="absolute inset-[-25%] bg-[conic-gradient(from_0deg,#f95312,#ffd000,#c6f432,#2f6bff,#f95312)] opacity-40 blur-3xl spin-slow" />
            <div className="relative flex flex-col items-center gap-3 px-6 text-center text-paper">
              <Sparkles className="size-8 animate-pulse text-brand" aria-hidden />
              <p className="font-display text-xl font-bold uppercase">Painting your concept…</p>
              <p className="text-xs text-paper/70">This usually takes 20 to 40 seconds. You can look at the designs below meanwhile.</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-paper">
            <p className="text-sm">{state.message}</p>
            <Button size="sm" variant="inverse" onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-carbon">AI concept.</span> A guide for our designers: your helmet is made from the template you choose.
        </span>
        {state.status === "done" && (
          <span className="flex shrink-0 items-center gap-3">
            <a href={state.image} download="lucas-racing-helmet-concept.jpg" className="inline-flex items-center gap-1 font-semibold text-carbon hover:underline">
              <Download className="size-3.5" aria-hidden /> Save
            </a>
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline">
              <RefreshCw className="size-3.5" aria-hidden /> New version
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  )
}
