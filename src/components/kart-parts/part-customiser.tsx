"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Eye, ImageIcon, Sparkles } from "lucide-react"

import { AddToBasket } from "@/components/shop/add-to-basket"
import { isExternalImage } from "@/lib/shop/images"
import { defaultFinish, describeFinish, partPreview, type PartFinish } from "@/lib/shop/part-finish"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { ShopProduct } from "@/types/shop"

import { PartPreviewCanvas } from "./part-preview-canvas"

/** What the big picture shows: the live preview, or one of the product photos. */
type View = { kind: "preview" } | { kind: "photo"; index: number }

/**
 * The 2D part customiser: a live preview of the part in the chosen paint, film or
 * chrome beside the finish picker, price and Add to basket.
 */
export function PartCustomiser({ product, priceBook, children }: { product: ShopProduct; priceBook: PriceBook; children?: React.ReactNode }) {
  const [finish, setFinish] = useState<PartFinish | null>(() => defaultFinish(product, priceBook))
  const [view, setView] = useState<View>({ kind: "preview" })
  const [compare, setCompare] = useState(false)
  const preview = partPreview(product)
  const finishText = finish ? describeFinish(product, finish, priceBook) : ""
  const frame = useRef<HTMLDivElement>(null)
  const mini = useRef<HTMLCanvasElement>(null)
  const [frameHidden, setFrameHidden] = useState(false)
  const showingPreview = view.kind === "preview" && Boolean(preview)

  // On phones the picker sits below the picture: show a small copy once it scrolls away.
  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setFrameHidden(!entry.isIntersecting), { threshold: 0.15 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mirror = useCallback((source: HTMLCanvasElement) => {
    const target = mini.current
    if (!target) return
    const scale = 192 / Math.max(source.width, source.height)
    target.width = Math.round(source.width * scale)
    target.height = Math.round(source.height * scale)
    const context = target.getContext("2d")
    context?.clearRect(0, 0, target.width, target.height)
    context?.drawImage(source, 0, 0, target.width, target.height)
  }, [])

  function changeFinish(next: PartFinish) {
    setFinish(next)
    setView({ kind: "preview" })
    setCompare(false)
  }

  const photo = view.kind === "photo" ? product.images[view.index] : null

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div ref={frame} className="relative scroll-mt-24 overflow-hidden rounded-[2rem] border border-carbon/10 bg-white">
          <div className="relative aspect-square p-4 sm:p-8">
            {photo ? (
              <Image
                src={photo}
                alt={`${product.title}, photo ${view.kind === "photo" ? view.index + 1 : 1}`}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                unoptimized={isExternalImage(photo)}
                className="object-contain p-4 sm:p-8"
              />
            ) : preview ? (
              <PartPreviewCanvas
                preview={preview}
                finish={compare ? null : finish}
                priceBook={priceBook}
                label={compare ? `${product.title}, original photo` : `${product.title}${finishText ? ` in ${finishText}` : ""}`}
                className="size-full"
                onDrawn={mirror}
              />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <ImageIcon className="size-10" aria-hidden />
              </div>
            )}
          </div>

          {view.kind === "preview" && preview && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-carbon px-3 py-1 text-xs font-semibold text-paper">
                <Sparkles className="size-3.5" aria-hidden /> Live preview
              </span>
              <button
                type="button"
                aria-pressed={compare}
                onPointerDown={() => setCompare(true)}
                onPointerUp={() => setCompare(false)}
                onPointerLeave={() => setCompare(false)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") setCompare(true)
                }}
                onKeyUp={() => setCompare(false)}
                className="pointer-events-auto inline-flex select-none items-center gap-1.5 rounded-full border border-carbon/15 bg-white/90 px-3 py-1 text-xs font-semibold text-carbon shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Eye className="size-3.5" aria-hidden /> Hold to see the original
              </button>
            </div>
          )}
        </div>

        {(product.images.length > 1 || (preview && product.images.length > 0)) && (
          <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Pictures">
            {preview && (
              <li>
                <button
                  type="button"
                  aria-pressed={view.kind === "preview"}
                  onClick={() => setView({ kind: "preview" })}
                  className={cn(
                    "grid size-18 place-items-center gap-0.5 rounded-xl border bg-white text-[0.65rem] font-semibold transition-colors",
                    view.kind === "preview" ? "border-carbon ring-2 ring-carbon" : "border-carbon/15 hover:border-carbon/40",
                  )}
                >
                  <Sparkles className="size-4 text-brand-ink" aria-hidden />
                  Your finish
                </button>
              </li>
            )}
            {product.images.map((image, index) => (
              <li key={image}>
                <button
                  type="button"
                  aria-pressed={view.kind === "photo" && view.index === index}
                  aria-label={`Photo ${index + 1}`}
                  onClick={() => setView({ kind: "photo", index })}
                  className={cn(
                    "relative block size-18 overflow-hidden rounded-xl border bg-white transition-colors",
                    view.kind === "photo" && view.index === index ? "border-carbon ring-2 ring-carbon" : "border-carbon/15 hover:border-carbon/40",
                  )}
                >
                  <Image src={image} alt="" fill sizes="72px" unoptimized={isExternalImage(image)} className="object-contain p-1.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          The preview shows how your finish sits on the part. Hydro-dip films wrap differently on every part, so the pattern on yours
          will vary.
        </p>
      </div>

      <button
        type="button"
        aria-label="Back to the preview"
        tabIndex={showingPreview && frameHidden ? 0 : -1}
        aria-hidden={!(showingPreview && frameHidden)}
        onClick={() => frame.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className={cn(
          "fixed bottom-24 right-4 z-40 grid size-28 place-items-center rounded-2xl border border-carbon/10 bg-white p-2 shadow-[0_16px_40px_-16px_rgb(17_20_18/0.5)] transition-[opacity,translate] duration-300 lg:hidden",
          showingPreview && frameHidden ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <canvas ref={mini} className="block max-h-full max-w-full object-contain" />
      </button>

      <div className="space-y-6">
        {children}
        <AddToBasket product={product} priceBook={priceBook} finish={finish} onFinishChange={changeFinish} />
      </div>
    </div>
  )
}
