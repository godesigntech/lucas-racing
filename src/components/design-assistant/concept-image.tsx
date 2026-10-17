"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getConceptImage, requestConceptImage } from "@/lib/actions/design-assistant"
import type { ConceptImageValues } from "@/lib/validations/design-assistant"

export type ConceptImageState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "done"; image: string }
  | { status: "error"; message: string }

const POLL_MS = 3000
/** Give up after about three minutes. */
const MAX_POLLS = 60

/**
 * Starts an AI concept image and checks on it every few seconds until it's ready.
 * Each start counts towards the visitor's hourly limit (checked on the server).
 */
export function useConceptImage() {
  const [state, setState] = useState<ConceptImageState>({ status: "idle" })
  const run = useRef(0)

  // Stop polling when the assistant closes.
  useEffect(() => () => void (run.current += 1), [])

  const start = useCallback(async (request: ConceptImageValues) => {
    const id = ++run.current
    setState({ status: "working" })
    const fail = (message: string) => id === run.current && setState({ status: "error", message })
    try {
      const started = await requestConceptImage(request)
      if (!started.ok || !started.data) return fail(started.ok ? "The AI couldn't start your concept." : started.message)
      for (let poll = 0; poll < MAX_POLLS; poll += 1) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS))
        if (id !== run.current) return
        const result = await getConceptImage(started.data.jobId)
        if (id !== run.current) return
        if (!result.ok || !result.data) return fail(result.ok ? "The AI couldn't finish your concept." : result.message)
        if (result.data.status === "done") return setState({ status: "done", image: result.data.image })
      }
      fail("The AI is taking too long. Please try again.")
    } catch {
      fail("Something went wrong. Check your connection and try again.")
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
    <figure className="overflow-hidden rounded-3xl border border-carbon/10 bg-card">
      <div className="relative aspect-square bg-carbon">
        {state.status === "done" ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated image held in memory as a data URL
          <img src={state.image} alt="AI concept of your custom helmet" className="size-full object-cover" />
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
          <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-ink hover:underline">
            <RefreshCw className="size-3.5" aria-hidden /> New version
          </button>
        )}
      </figcaption>
    </figure>
  )
}
