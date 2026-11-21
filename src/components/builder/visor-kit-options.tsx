"use client"

import { Check } from "lucide-react"

import { usePricesHidden } from "@/components/builder/prices-context"
import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConfiguratorOption, PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"

type Choice = { value: string; label: string; swatch: string | null; price: number | null; hint?: string | null }

/**
 * The Arai SK-6 visor fitting kits, as the workshop buys them: a plastic kit (pivot plates,
 * round caps and side pods) in one colour, and a screw kit (screws and bolts) in another
 * colour and a finish style, so a helmet can have green plastics with blue screws. Each is
 * optional. A choice without a price yet shows "Price on request"; checkout waits for it.
 */
export function VisorKitOptions({ config, priceBook, update }: {
  config: HelmetConfiguration
  priceBook: PriceBook
  update: (changes: Partial<HelmetConfiguration>) => void
}) {
  const pricesHidden = usePricesHidden()
  const active = (options: ConfiguratorOption[] | undefined) => (options ?? []).filter((option) => option.isActive)
  const plastics = active(priceBook.options.visor_kit)
  const screws = active(priceBook.options.visor_screws)
  const styles = active(priceBook.options.visor_screw_style)
  if (config.model !== "arai-sk6" || (plastics.length === 0 && screws.length === 0)) return null

  const priceLabel = (price: number | null) => (pricesHidden ? null : price === null ? "Price on request" : formatSurcharge(price) || "Included")
  const standard: Choice = { value: "", label: "Standard", swatch: "#2b2e30", price: 0 }

  return (
    <section aria-label="Visor fitting kit" className="space-y-5 rounded-2xl border border-carbon/15 p-4">
      <div>
        <h3 className="font-display text-xl font-bold uppercase">Visor fitting kit</h3>
        <p className="text-sm text-muted-foreground">Colour the visor plastics and screws separately, for example green plastics with blue screws. The 3D view shows them on your helmet.</p>
      </div>

      {plastics.length > 0 && (
        <ChoiceGroup
          title="Plastics"
          description="Pivot plates, round caps and side pods."
          choices={[standard, ...plastics]}
          value={config.visorKit ?? ""}
          priceLabel={priceLabel}
          onChange={(value) => update({ visorKit: value || undefined })}
        />
      )}

      {screws.length > 0 && (
        <ChoiceGroup
          title="Screws"
          description="The visor screws and bolts."
          choices={[standard, ...screws]}
          value={config.visorScrews ?? ""}
          priceLabel={priceLabel}
          // A screw kit comes in a style; Plain until the customer picks another.
          onChange={(value) =>
            update(value ? { visorScrews: value, visorScrewStyle: config.visorScrewStyle ?? styles[0]?.value } : { visorScrews: undefined, visorScrewStyle: undefined })
          }
        />
      )}

      {config.visorScrews && styles.length > 0 && (
        <ChoiceGroup
          title="Screw style"
          description="The finish cut into the screw heads."
          choices={styles}
          value={config.visorScrewStyle ?? styles[0].value}
          priceLabel={priceLabel}
          onChange={(value) => update({ visorScrewStyle: value })}
          plain
        />
      )}
    </section>
  )
}

function ChoiceGroup({ title, description, choices, value, priceLabel, onChange, plain = false }: {
  title: string
  description: string
  choices: Choice[]
  value: string
  priceLabel: (price: number | null) => string | null
  onChange: (value: string) => void
  /** Styles have no colour, so no swatch. */
  plain?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="font-semibold">{title}</span> <span className="text-muted-foreground">· {description}</span>
      </p>
      <div role="radiogroup" aria-label={`Visor kit ${title.toLowerCase()}`} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {choices.map((choice) => {
          const selected = value === choice.value
          const price = choice.value ? priceLabel(choice.price) : null
          return (
            <button
              key={choice.value || "standard"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(choice.value)}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition",
                selected ? "border-brand-ink bg-accent ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
              )}
            >
              {!plain && <span aria-hidden className="mt-0.5 size-5 shrink-0 rounded-full ring-1 ring-carbon/20" style={{ backgroundColor: choice.swatch ?? "#2b2e30" }} />}
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold">
                  {choice.label}
                  {selected && <Check className="size-3.5 text-brand-ink" aria-hidden />}
                </span>
                {price && <span className="block text-xs text-muted-foreground">{price}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
