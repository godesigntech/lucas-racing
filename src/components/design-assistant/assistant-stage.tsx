import { FileText, ImagePlus, RefreshCw, Sparkles } from "lucide-react"

import type { PreparedPhoto } from "@/lib/design-assistant/photo"

import { ConceptImage, type ConceptImageState } from "./concept-image"

const noop = () => {}

const steps = [
  { icon: ImagePlus, title: "Show us what you like", text: "Upload a helmet you like, or describe the look." },
  { icon: Sparkles, title: "The AI designs it", text: "A bespoke design, in your colours." },
  { icon: RefreshCw, title: "Change it for free", text: "As many new versions as you need." },
  { icon: FileText, title: "Ask for a quote", text: "Happy? We'll email you a price." },
]

interface AssistantStageProps {
  concept: ConceptImageState
  /** The AI is reading the brief (before the picture starts painting). */
  analysing: boolean
  photo: PreparedPhoto | null
  /** Paints the concept again (not needed before there is one). */
  onRetry?: () => void
  /** Show the four steps on the starting panel (off when the page lists them already). */
  showSteps?: boolean
}

/**
 * The result picture: how it works to begin with, a painting animation while the AI
 * works, then the AI concept (or the customer's photo when no picture can be made).
 */
export function AssistantStage({ concept, analysing, photo, onRetry, showSteps = true }: AssistantStageProps) {
  if (analysing) return <ConceptImage state={{ status: "working" }} onRetry={onRetry ?? noop} />
  if (concept.status !== "idle") return <ConceptImage state={concept} onRetry={onRetry ?? noop} />

  if (photo) {
    return (
      <figure className="overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card">
        <div className="relative aspect-square bg-[#f4f3ef]">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the customer's photo */}
          <img src={photo.previewUrl} alt="Your reference photo" className="size-full object-contain p-2" />
        </div>
        <figcaption className="px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-carbon">Your reference.</span> The AI uses its colours and style for your design.
        </figcaption>
      </figure>
    )
  }

  return (
    <div className="relative isolate flex flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] bg-carbon p-5 text-paper sm:p-8 lg:aspect-square">
      <div aria-hidden className="absolute inset-[-30%] -z-10 bg-[conic-gradient(from_0deg,#f95312,#ffd000,#c6f432,#2f6bff,#f95312)] opacity-25 blur-3xl spin-slow" />
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-40" />
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5 text-brand" aria-hidden /> Free design service
        </span>
        <p className="mt-4 max-w-sm font-display text-3xl font-bold uppercase leading-none sm:text-5xl">Your design appears here</p>
        <p className="mt-3 max-w-sm text-sm text-paper/70">Tell the AI what you like and it paints a helmet design just for you, in about 30 seconds.</p>
      </div>
      {showSteps && (
      <ol className="grid grid-cols-2 gap-2 sm:gap-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:items-start sm:gap-3 sm:p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand text-carbon sm:size-9">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-xs sm:text-sm">
              <span className="block text-[0.7rem] font-semibold text-paper/50 max-sm:hidden">Step {index + 1}</span>
              <span className="block font-semibold leading-tight">{title}</span>
              <span className="block text-xs text-paper/60 max-sm:hidden">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      )}
    </div>
  )
}
