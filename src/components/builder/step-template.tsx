"use client"

import { Check } from "lucide-react"
import Image from "next/image"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { getCategory } from "@/lib/catalog/categories"
import { formatPrice } from "@/lib/format"
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
  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <legend className="sr-only">Template</legend>
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
                {artwork ? <Image src={artwork.thumbnail} alt={`${product.name} on the Bell KC7, example colours`} width={900} height={900} className="size-full object-contain" /> : <HelmetArt look={product.look} className="max-h-full" />}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 bg-card p-3">
                <span className="text-[0.68rem] text-muted-foreground">{getCategory(product.category).label}</span>
                <span className="font-display text-lg font-bold uppercase leading-tight">{product.name}</span>
                <span className="text-xs font-semibold">{formatPrice(product.startingPrice)}</span>
                <span className="text-[0.68rem] text-muted-foreground">{artwork ? "3D racing template · example colours" : "Illustrated preview"}</span>
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
