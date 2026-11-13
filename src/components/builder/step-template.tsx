"use client"

import { Check, Sparkles, WandSparkles } from "lucide-react"
import Link from "next/link"

import { DESIGN_ASSISTANT_HREF } from "@/components/design-assistant/open-assistant-button"
import { TemplatePicture } from "@/components/helmet/template-picture"
import { getCategory } from "@/lib/catalog/categories"
import { formatPrice } from "@/lib/format"
import { usePricesHidden } from "@/components/builder/prices-context"
import { getTemplateArtwork } from "@/lib/helmet-3d/templates"
import { cn } from "@/lib/utils"
import type { CatalogProduct } from "@/types/product"

interface StepTemplateProps {
  products: CatalogProduct[]
  value: string
  /** The chosen helmet: templates that aren't made for it are marked. */
  modelId: string
  onChange: (slug: string) => void
}

/** Every design as a selectable card with its showcase illustration. */
export function StepTemplate({ products, value, modelId, onChange }: StepTemplateProps) {
  // A sketch (own-helmet page) shows no prices, and the AI designer would take them off the page.
  const sketch = usePricesHidden()
  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <legend className="sr-only">Template</legend>
      {/* A blank helmet first: the AI designs something unique instead of starting from a template. */}
      {!sketch && (
      <Link
        href={DESIGN_ASSISTANT_HREF}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-brand-ink/50 text-left transition-colors hover:border-brand-ink"
      >
        <span className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-carbon">
          <span aria-hidden className="absolute -inset-1/4 bg-[conic-gradient(from_0deg,#f95312,#ffd000,#c6f432,#2f6bff,#f95312)] opacity-35 blur-2xl" />
          <span aria-hidden className="relative grid size-16 place-items-center rounded-2xl bg-brand text-carbon shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)] ring-4 ring-white/15">
            <WandSparkles className="size-8" />
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-0.5 bg-card p-3">
          <span className="flex items-center gap-1 text-[0.68rem] font-semibold text-brand-ink">
            <Sparkles className="size-3" aria-hidden /> AI design
          </span>
          <span className="font-display text-lg font-bold uppercase leading-tight">Design it with AI</span>
          <span className="text-xs text-muted-foreground">Let AI design a helmet unique to you. Free, with unlimited changes.</span>
        </span>
      </Link>
      )}
      {products.map((product) => {
        const checked = product.slug === value
        const fits = product.models.includes(modelId)
        const artwork = getTemplateArtwork(modelId, product.slug)
        return (
          <label key={product.slug} className="cursor-pointer">
            <input type="radio" name="template" checked={checked} onChange={() => onChange(product.slug)} className="peer sr-only" />
            <span
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl border transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                checked ? "border-brand-ink ring-1 ring-brand-ink" : "border-carbon/15 hover:border-carbon/40",
              )}
            >
              <span className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] p-3">
                <TemplatePicture slug={product.slug} name={product.name} look={product.look} modelId={modelId} />
              </span>
              <span className="flex flex-1 flex-col gap-0.5 bg-card p-3">
                <span className="text-[0.68rem] text-muted-foreground">{getCategory(product.category).label}</span>
                <span className="font-display text-lg font-bold uppercase leading-tight">{product.name}</span>
                {!sketch && <span className="text-xs font-semibold">{formatPrice(product.startingPrice)}</span>}
                <span className="text-[0.68rem] text-muted-foreground">{artwork ? "3D racing template · example colours" : "Example colours"}</span>
                {!fits && <span className="text-[0.68rem] text-muted-foreground">Not available on this helmet</span>}
              </span>
              {checked && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-brand-ink text-paper">
                  <Check className="size-3.5" aria-hidden />
                </span>
              )}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
