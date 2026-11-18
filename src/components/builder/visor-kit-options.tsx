"use client"

import { Check } from "lucide-react"

import { usePricesHidden } from "@/components/builder/prices-context"
import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"

/**
 * The Arai SK-6 visor fitting kit: the visor pivot, side covers and screws swapped for a
 * coloured kit. A kit without a price yet shows "Price on request"; checkout waits for it.
 */
export function VisorKitOptions({ config, priceBook, update }: {
  config: HelmetConfiguration
  priceBook: PriceBook
  update: (changes: Partial<HelmetConfiguration>) => void
}) {
  const pricesHidden = usePricesHidden()
  const kits = (priceBook.options.visor_kit ?? []).filter((option) => option.isActive)
  if (config.model !== "arai-sk6" || kits.length === 0) return null

  const priceLabel = (price: number | null) => (pricesHidden ? null : price === null ? "Price on request" : formatSurcharge(price) || "Included")

  return (
    <section aria-label="Visor fitting kit" className="space-y-4 rounded-2xl border border-carbon/15 p-4">
      <div>
        <h3 className="font-display text-xl font-bold uppercase">Visor fitting kit</h3>
        <p className="text-sm text-muted-foreground">Swap the visor pivot, side covers and screws for a coloured kit. The 3D view shows it on your helmet.</p>
      </div>
      <div role="radiogroup" aria-label="Visor fitting kit colour" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[{ value: "", label: "Standard (no kit)", swatch: "#2b2e30", price: 0 as number | null }, ...kits].map((kit) => {
          const selected = (config.visorKit ?? "") === kit.value
          return (
            <button
              key={kit.value || "none"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update({ visorKit: kit.value || undefined })}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition",
                selected ? "border-brand-ink bg-accent ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
              )}
            >
              <span aria-hidden className="mt-0.5 size-5 shrink-0 rounded-full ring-1 ring-carbon/20" style={{ backgroundColor: kit.swatch ?? "#2b2e30" }} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold">
                  {kit.label}
                  {selected && <Check className="size-3.5 text-brand-ink" aria-hidden />}
                </span>
                {kit.value && priceLabel(kit.price) && <span className="block text-xs text-muted-foreground">{priceLabel(kit.price)}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
