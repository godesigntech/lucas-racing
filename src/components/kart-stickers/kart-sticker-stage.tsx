import Image from "next/image"
import { LayoutTemplate, Sparkles } from "lucide-react"

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
  /** Buttons for the design shown: send for a quote, try a variation, delete. */
  actions?: React.ReactNode
}

/**
 * The big picture beside the kart sticker steps, like the 3D helmet in the builder:
 * the blank layout to start with, then the AI's design, with every saved design below.
 */
export function KartStickerStage({ layout, design, designs, pending, onShow, actions }: KartStickerStageProps) {
  const blank = layout && isReadyLayout(layout) ? layout : null
  const designLayout = design ? findKartLayout(design.layout) : undefined

  return (
    <div className="space-y-3">
      <figure className="overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card">
        <div className="relative aspect-square bg-white lg:aspect-[5/4]">
          {design ? (
            design.imageUrl ? (
              <a href={design.imageUrl} target="_blank" rel="noreferrer" className="block size-full" aria-label="Open the full-size design">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture */}
                <img src={design.imageUrl} alt={`Kart sticker design: ${design.prompt}`} className="size-full object-contain" />
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

          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-carbon px-3 py-1 text-xs font-semibold text-paper">
            {design ? (
              <>
                <Sparkles className="size-3.5 text-brand" aria-hidden /> Your design
              </>
            ) : (
              <>
                <LayoutTemplate className="size-3.5 text-brand" aria-hidden /> {blank ? `${blank.name} layout` : "Layout"}
              </>
            )}
          </span>

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

        <figcaption className="space-y-3 px-4 py-3">
          {design ? (
            <>
              <div>
                <p className="line-clamp-2 text-sm">{design.prompt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[design.kartModel, designLayout?.name, kartFinishLabels[design.finish]?.label, design.raceNumber && `#${design.raceNumber}`, design.driverName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-carbon">Blank layout.</span> The AI fills these panels with your design: nassau, side pods
              and front bumper.
            </p>
          )}
        </figcaption>
      </figure>

      {designs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Your designs ({designs.length}) <span className="font-normal">· tap one to see it</span>
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {blank && (
              <li>
                <button
                  type="button"
                  aria-pressed={!design}
                  onClick={() => onShow(null)}
                  className={cn(
                    "relative block size-18 overflow-hidden rounded-xl border bg-white",
                    !design ? "border-carbon ring-2 ring-carbon" : "border-carbon/15 hover:border-carbon/40",
                  )}
                >
                  <Image src={blank.image} alt="" fill sizes="72px" className="object-contain p-1 opacity-60" />
                  <span className="absolute inset-x-0 bottom-0 bg-carbon/80 py-0.5 text-center text-[0.6rem] font-semibold text-paper">Blank</span>
                </button>
              </li>
            )}
            {designs.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={design?.id === item.id}
                  aria-label={`Design ${designs.length - index}: ${item.prompt}`}
                  onClick={() => onShow(item.id)}
                  className={cn(
                    "block size-18 overflow-hidden rounded-xl border bg-white",
                    design?.id === item.id ? "border-carbon ring-2 ring-carbon" : "border-carbon/15 hover:border-carbon/40",
                  )}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-[0.6rem] text-muted-foreground">No picture</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
