import Image from "next/image"
import { ChevronLeft, ChevronRight, Eye, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react"

import { findKartLayout, isReadyLayout, kartFinishLabels, type KartLayout } from "@/lib/kart-stickers/options"
import { cn } from "@/lib/utils"
import type { KartDesign } from "@/types/kart-stickers"

interface KartStickerStageProps {
  /** The layout chosen in the form. */
  layout: KartLayout | undefined
  /** The design in the big picture; null shows the blank layout. */
  design: KartDesign | null
  designs: KartDesign[]
  /** The AI is painting a new design. */
  pending: boolean
  onShow: (id: string | null) => void
  /** Buttons for the design shown: send for a quote, try a variation, save, delete. */
  actions?: React.ReactNode
}

/**
 * The results side: a live preview (the blank layout, then the AI's design) with
 * arrows through every saved design, thumbnails, a summary and the next steps.
 */
export function KartStickerStage({ layout, design, designs, pending, onShow, actions }: KartStickerStageProps) {
  const blank = layout && isReadyLayout(layout) ? layout : null
  const designLayout = design ? findKartLayout(design.layout) : undefined
  const index = design ? designs.findIndex((item) => item.id === design.id) : -1
  // Newest first in the list, so "1 of 3" is the oldest: count from the end.
  const position = index >= 0 ? designs.length - index : 0

  function step(by: number) {
    if (designs.length === 0) return
    const next = index < 0 ? 0 : index - by
    if (next >= 0 && next < designs.length) onShow(designs[next].id)
  }

  return (
    <section aria-label="Your results" className="overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card">
      <header className="m-2 flex items-center justify-between gap-3 rounded-2xl bg-carbon px-4 py-3 text-paper">
        <p className="flex min-w-0 items-center gap-2 font-display text-lg font-bold uppercase leading-none">
          <Eye className="size-5 shrink-0 text-brand" aria-hidden />
          <span className="truncate">{design ? "Your design" : blank ? `${blank.name} layout` : "Live preview"}</span>
        </p>
        {designs.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-paper/80">
              {design ? `${position} / ${designs.length}` : `${designs.length} saved`}
            </span>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={position <= 1 && Boolean(design)}
              aria-label="Previous design"
              className="grid size-8 place-items-center rounded-lg border border-white/15 transition-colors hover:bg-white/10 disabled:opacity-35"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={position >= designs.length}
              aria-label="Next design"
              className="grid size-8 place-items-center rounded-lg border border-white/15 transition-colors hover:bg-white/10 disabled:opacity-35"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </header>

      <div className="relative aspect-square bg-white sm:aspect-[4/3]">
        {design ? (
          design.imageUrl ? (
            <a href={design.imageUrl} target="_blank" rel="noreferrer" className="block size-full" aria-label="Open the full-size design">
              {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture */}
              <img src={design.imageUrl} alt={`Kart sticker design: ${design.prompt}`} className="size-full object-contain p-3" />
            </a>
          ) : (
            <p className="grid size-full place-items-center text-sm text-muted-foreground">Picture unavailable</p>
          )
        ) : blank ? (
          <Image src={blank.image} alt={`${blank.name} blank sticker layout`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-4" preload />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <LayoutTemplate className="size-10 opacity-40" aria-hidden />
          </span>
        )}

        {pending && (
          <div className="absolute inset-0 grid place-items-center overflow-hidden bg-carbon/85" role="status">
            <div aria-hidden className="absolute inset-[-25%] bg-[conic-gradient(from_0deg,#f95312,#ffd000,#c6f432,#2f6bff,#f95312)] opacity-40 blur-3xl spin-slow" />
            <div className="relative flex flex-col items-center gap-3 px-6 text-center text-paper">
              <Sparkles className="size-8 animate-pulse text-brand" aria-hidden />
              <p className="font-display text-xl font-bold uppercase">Designing your stickers…</p>
              <p className="text-xs text-paper/70">This usually takes about half a minute.</p>
            </div>
          </div>
        )}
      </div>

      {(designs.length > 0 || blank) && (
        <ul className="grid grid-cols-4 gap-2 px-3 pt-3 sm:grid-cols-6" aria-label="Your designs">
          {blank && (
            <li>
              <button
                type="button"
                aria-pressed={!design}
                onClick={() => onShow(null)}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border bg-white",
                  !design ? "border-brand ring-2 ring-brand/40" : "border-carbon/15 hover:border-carbon/40",
                )}
              >
                <Image src={blank.image} alt="" fill sizes="96px" className="object-contain p-1 opacity-60" />
                <span className="absolute inset-x-0 bottom-0 bg-carbon/80 py-0.5 text-center text-[0.6rem] font-semibold text-paper">Blank layout</span>
              </button>
            </li>
          )}
          {designs.map((item, itemIndex) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={design?.id === item.id}
                aria-label={`Design ${designs.length - itemIndex}: ${item.prompt}`}
                onClick={() => onShow(item.id)}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-xl border bg-white",
                  design?.id === item.id ? "border-brand ring-2 ring-brand/40" : "border-carbon/15 hover:border-carbon/40",
                )}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture
                  <img src={item.imageUrl} alt="" className="size-full object-contain p-1" />
                ) : (
                  <span className="grid size-full place-items-center text-[0.6rem] text-muted-foreground">No picture</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        {design ? (
          <>
            <div>
              <p className="flex items-center gap-2 font-display text-lg font-bold uppercase leading-none">
                <Sparkles className="size-4 text-brand-ink" aria-hidden /> AI design summary
              </p>
              <p className="mt-2 line-clamp-3 text-sm">{design.prompt}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[design.kartModel, designLayout?.name, kartFinishLabels[design.finish]?.label, design.raceNumber && `#${design.raceNumber}`, design.driverName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-carbon">Blank layout.</span> The AI fills these panels with your design: nassau, side pods and
            front bumper. Fill in the steps and press &ldquo;Design my stickers&rdquo;.
          </p>
        )}
        <p className="flex items-start gap-3 rounded-2xl bg-accent p-3 text-sm text-accent-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden />
          <span>
            <span className="font-semibold">AI creates the concept.</span> We check every design and prepare it for print before quoting.
          </span>
        </p>
      </div>
    </section>
  )
}
