"use client"

import { useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { PricesHiddenContext } from "@/components/builder/prices-context"
import { StepVisorStrip } from "@/components/builder/step-fittings"
import { helmetFontStyles } from "@/components/helmet-3d/helmet-fonts"
import { Button } from "@/components/ui/button"
import { basket } from "@/lib/basket/basket-store"
import { formatMoney } from "@/lib/format"
import { findStickerDesign, stickerColours } from "@/lib/helmet-3d/sticker-designs"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, VisorStrip } from "@/types/configurator"
import type { ShopProduct } from "@/types/shop"

import { StickerPreview } from "./sticker-preview"

const LUCAS = "Lucas Racing holographic"
const DESIGN = "Your design"
const DESIGN_HOLO = "Your design, holographic"

/** Stickers are cut to each brand's visor template, so the customer says which they have. */
const helmets = [
  { id: "bell-kc7", label: "Bell", fits: "Bell KC7 and other Bell helmets" },
  { id: "arai-sk6", label: "Arai", fits: "Arai SK-6 and other Arai helmets" },
] as const
type HelmetId = (typeof helmets)[number]["id"]

const startStrip: VisorStrip = { enabled: false, colour: "#101114", text: "", textColour: "#ffffff", font: "racing" }

/**
 * A visor sticker bought on its own: the Lucas Racing holographic one, or one of the
 * designs in the customer's colours, cut to their helmet (Bell or Arai). Every sticker is
 * a top band and a bottom strip. Uses the helmet builder's sticker step, with this
 * product's own prices (£15, or £30 for a design in holographic).
 */
export function VisorStickerShop({ product, priceBook }: { product: ShopProduct; priceBook: PriceBook }) {
  const [strip, setStrip] = useState<VisorStrip>(startStrip)
  const [helmet, setHelmet] = useState<HelmetId>("bell-kc7")
  const [quantity, setQuantity] = useState(1)
  const variantFor = (name: string) => product.variants.find((variant) => variant.options.Sticker === name)
  const variant = !strip.enabled ? variantFor(LUCAS) : strip.holographic ? variantFor(DESIGN_HOLO) : variantFor(DESIGN)
  const design = findStickerDesign(strip.design)
  const helmetInfo = helmets.find((item) => item.id === helmet)!

  // The step works on a helmet build; here only its sticker and the helmet's shape matter.
  const config = { visorStrip: strip, model: helmet } as HelmetConfiguration
  const update = (changes: Partial<HelmetConfiguration>) => {
    if (changes.visorStrip) setStrip(changes.visorStrip)
  }

  const colourName = (value: string) => priceBook.options.base.find((option) => option.value === value)?.label ?? value.toUpperCase()

  /** What the workshop prints, saved with the order. */
  function details(): { label: string; value: string }[] {
    const shape = { label: "Helmet", value: helmetInfo.label }
    if (!strip.enabled) return [shape, { label: "Sticker", value: "Lucas Racing holographic, with lucasracing.co.uk bottom strip" }]
    const font = helmetFontStyles.find((item) => item.id === strip.font)?.label ?? strip.font
    const ink = colourName(strip.textColour ?? "#ffffff")
    const colours = design
      ? design.parts.map((part) => `${part.label} ${colourName(stickerColours(design, strip.designColours)[part.key])}`).join(", ")
      : colourName(strip.colour)
    return [
      shape,
      { label: "Design", value: design ? design.name : "Plain band" },
      { label: "Colours", value: colours },
      { label: "Top band text", value: strip.text.trim() ? `${strip.text.trim()} (${ink}, ${font} lettering)` : "No text" },
      { label: "Bottom strip text", value: strip.bottomText?.trim() ? `${strip.bottomText.trim()} (${ink}, ${font} lettering)` : "No text" },
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
        variantLabel: `${variant.options.Sticker ?? ""} · ${helmetInfo.label}`,
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
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Your helmet</legend>
          <div className="grid grid-cols-2 gap-2">
            {helmets.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={helmet === item.id}
                onClick={() => setHelmet(item.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition",
                  helmet === item.id ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
                )}
              >
                <span className="block font-display text-2xl font-bold uppercase leading-none">{item.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.fits}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Each brand&apos;s visor is a different shape, so your sticker is cut to fit yours.</p>
        </fieldset>
        <StickerPreview strip={strip} model={helmet} />
        <div className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {variant?.options.Sticker} · {helmetInfo.label}
              </p>
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
          <p className="text-xs text-muted-foreground">Every sticker is a top band and a bottom strip. Ordering a helmet? One comes free with every helmet, chosen in the helmet builder.</p>
        </div>
      </div>

      <PricesHiddenContext.Provider value>
        <StepVisorStrip priceBook={priceBook} config={config} update={update} />
      </PricesHiddenContext.Provider>
    </div>
  )
}
