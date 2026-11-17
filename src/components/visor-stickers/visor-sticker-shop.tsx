"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { PricesHiddenContext } from "@/components/builder/prices-context"
import { StepVisorStrip } from "@/components/builder/step-fittings"
import { helmetFontStyles } from "@/components/helmet-3d/helmet-fonts"
import { Button } from "@/components/ui/button"
import { basket } from "@/lib/basket/basket-store"
import { formatMoney } from "@/lib/format"
import { findStickerDesign, recolouredSticker, stickerColours } from "@/lib/helmet-3d/sticker-designs"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, VisorStrip } from "@/types/configurator"
import type { ShopProduct } from "@/types/shop"

const LUCAS = "Lucas Racing holographic"
const DESIGN = "Your design"
const DESIGN_HOLO = "Your design, holographic"

const startStrip: VisorStrip = { enabled: false, colour: "#101114", text: "", textColour: "#ffffff", font: "racing" }

/**
 * A visor sticker bought on its own: the Lucas Racing holographic one, or one of the
 * designs in the customer's colours. Uses the helmet builder's sticker step, with this
 * product's own prices (£15, or £30 for a design in holographic).
 */
export function VisorStickerShop({ product, priceBook }: { product: ShopProduct; priceBook: PriceBook }) {
  const [strip, setStrip] = useState<VisorStrip>(startStrip)
  const [quantity, setQuantity] = useState(1)
  const variantFor = (name: string) => product.variants.find((variant) => variant.options.Sticker === name)
  const variant = !strip.enabled ? variantFor(LUCAS) : strip.holographic ? variantFor(DESIGN_HOLO) : variantFor(DESIGN)
  const design = findStickerDesign(strip.design)

  // The step works on a helmet build; here only its sticker matters.
  const config = { visorStrip: strip } as HelmetConfiguration
  const update = (changes: Partial<HelmetConfiguration>) => {
    if (changes.visorStrip) setStrip(changes.visorStrip)
  }

  const colourName = (value: string) => priceBook.options.base.find((option) => option.value === value)?.label ?? value.toUpperCase()

  /** What the workshop prints, saved with the order. */
  function details(): { label: string; value: string }[] {
    if (!strip.enabled) return [{ label: "Sticker", value: "Lucas Racing holographic, with lucasracing.co.uk strip" }]
    const font = helmetFontStyles.find((item) => item.id === strip.font)?.label ?? strip.font
    const colours = design
      ? design.parts.map((part) => `${part.label} ${colourName(stickerColours(design, strip.designColours)[part.key])}`).join(", ")
      : colourName(strip.colour)
    return [
      { label: "Design", value: design ? design.name : "Plain band" },
      { label: "Colours", value: colours },
      { label: "Text", value: strip.text.trim() ? `${strip.text.trim()} (${colourName(strip.textColour ?? "#ffffff")}, ${font} lettering)` : "No text" },
    ]
  }

  function add() {
    if (!variant) return
    basket.addProduct(
      {
        variantId: variant.id,
        productSlug: product.slug,
        storeId: product.storeId,
        name: product.title,
        variantLabel: variant.options.Sticker ?? "",
        imageUrl: product.images[0] ?? null,
        details: details(),
      },
      quantity,
    )
    toast.success(
      <span>
        Visor sticker added to your basket.{" "}
        <Link href="/basket" className="font-semibold underline underline-offset-2">
          View basket
        </Link>
      </span>,
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4 lg:sticky lg:top-24">
        <StickerPreview strip={strip} />
        <div className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{variant?.options.Sticker}</p>
              <p className="font-display text-5xl font-bold">{variant ? formatMoney(variant.price * quantity) : "Not available"}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-carbon/15 p-1" role="group" aria-label="Quantity">
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="One fewer">
                <Minus />
              </Button>
              <span className="w-6 text-center font-semibold tabular-nums">{quantity}</span>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setQuantity((value) => Math.min(20, value + 1))} aria-label="One more">
                <Plus />
              </Button>
            </div>
          </div>
          <Button type="button" size="lg" className="w-full" disabled={!variant} onClick={add}>
            <ShoppingBag /> Add to basket
          </Button>
          <p className="text-xs text-muted-foreground">Ordering a helmet? One sticker comes free with every helmet, chosen in the helmet builder.</p>
        </div>
      </div>

      <PricesHiddenContext.Provider value>
        <StepVisorStrip priceBook={priceBook} config={config} update={update} />
      </PricesHiddenContext.Provider>
    </div>
  )
}

/** The sticker laid flat: both Lucas Racing pieces, or the design in the chosen colours with the text. */
function StickerPreview({ strip }: { strip: VisorStrip }) {
  const design = findStickerDesign(strip.design)
  const colourKey = useMemo(() => JSON.stringify(strip.designColours ?? {}), [strip.designColours])
  const [art, setArt] = useState<{ key: string; url: string } | null>(null)
  const artKey = design ? `${design.id}:${colourKey}` : ""

  useEffect(() => {
    if (!design) return
    let cancelled = false
    recolouredSticker(design, JSON.parse(colourKey) as Record<string, string>)
      .then((url) => !cancelled && setArt({ key: `${design.id}:${colourKey}`, url }))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [design, colourKey])

  const font = helmetFontStyles.find((item) => item.id === strip.font) ?? helmetFontStyles[0]
  const text = strip.text.trim()

  return (
    <div className="flex aspect-[16/7] flex-col items-center justify-center gap-3 rounded-3xl bg-[radial-gradient(circle_at_50%_40%,#ffffff,#e6e5df_85%)] p-6 ring-1 ring-carbon/10" aria-label="Your visor sticker">
      {!strip.enabled ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- the sticker's own artwork */}
          <img src="/stickers/lucas-racing-visor.webp?v=3" alt="Lucas Racing holographic visor sticker" className="w-full object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element -- the sticker's own artwork */}
          <img src="/stickers/lucas-racing-visor-lower.webp?v=1" alt="lucasracing.co.uk strip" className="w-[54%] object-contain" />
        </>
      ) : (
        <div className="relative w-full">
          {design ? (
            art?.key === artKey ? (
              // eslint-disable-next-line @next/next/no-img-element -- the recoloured design
              <img src={art.url} alt={`${design.name} visor sticker`} className="w-full object-contain" />
            ) : (
              <div className="aspect-[1200/210] w-full animate-pulse rounded-xl bg-carbon/5" />
            )
          ) : (
            <div className="aspect-[11/1] w-full rounded-md ring-1 ring-carbon/15" style={{ backgroundColor: strip.colour }} />
          )}
          {text && (
            <span
              className="pointer-events-none absolute inset-x-0 top-[28%] -translate-y-1/2 truncate px-[22%] text-center text-[clamp(0.8rem,3.2vw,1.6rem)] leading-none"
              style={{ color: strip.textColour ?? "#ffffff", fontFamily: font.family, fontWeight: font.weight, fontStyle: font.italic ? "italic" : "normal", top: design ? "28%" : "50%" }}
            >
              {text}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
