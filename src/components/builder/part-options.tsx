"use client"

import { useState } from "react"

import { partsFor, type HelmetPartKey } from "@/lib/helmet-3d/parts"
import type { HelmetConfiguration } from "@/types/configurator"
import type { PriceBook } from "@/types/catalog"
import { SwatchGrid } from "./swatch-grid"

const helmetNames: Record<string, string> = { "bell-kc7": "Bell KC7", "arai-sk6": "Arai SK-6" }

/** Each helmet's own exterior parts (grilles, vents, screws), coloured one at a time. */
export function PartOptions({ config, priceBook, update }: {
  config: HelmetConfiguration
  priceBook: PriceBook
  update: (changes: Partial<HelmetConfiguration>) => void
}) {
  // The trims are chosen above, with their own colour range and prices.
  const parts = partsFor(config.model).filter(({ key }) => key !== "eyeportTrim" && key !== "baseTrim")
  const [selected, setSelected] = useState<HelmetPartKey | undefined>(parts[0]?.key)
  const part = parts.find(({ key }) => key === selected)
  if (!part) return null
  const colour = config[part.key] ?? part.defaultColour ?? config.trim
  const palette = priceBook.options.base.filter((option) => option.isActive).map((option) => ({ ...option, price: 0 }))
  if (!palette.some((option) => option.value === colour)) {
    palette.push({ group: "base", value: colour, label: "Custom", swatch: colour, price: 0, hint: null, isActive: true, sortOrder: palette.length })
  }
  const title = `${helmetNames[config.model] ?? "Helmet"} accessories`

  return (
    <section aria-label={title} className="space-y-4 rounded-2xl border border-carbon/15 p-4">
      <div>
        <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
        <p className="text-sm text-muted-foreground">Choose a part, then its colour. Each part changes independently in 3D.</p>
      </div>
      <div role="group" aria-label="Accessory part" className="grid grid-cols-2 gap-2">
        {parts.map((item) => (
          <button type="button" key={item.key} aria-pressed={part.key === item.key} onClick={() => setSelected(item.key)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium ${part.key === item.key ? "border-brand-ink bg-accent" : "border-carbon/15"}`}>
            <span aria-hidden className="size-4 shrink-0 rounded-full border border-carbon/20" style={{ backgroundColor: config[item.key] ?? item.defaultColour ?? config.trim }} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 border-t border-carbon/10 pt-4">
        <p className="text-sm text-muted-foreground">{part.hint}</p>
        <SwatchGrid label={`${part.label} colour`} options={palette} value={colour} onChange={(value) => update({ [part.key]: value })} />
        <label className="flex items-center gap-3 text-sm">
          Custom colour
          <input aria-label={`${part.label} custom colour`} type="color" value={colour} onChange={(event) => update({ [part.key]: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-carbon/20" />
          <span className="font-mono text-xs">{colour.toUpperCase()}</span>
        </label>
        <button type="button" disabled={!config[part.key]} onClick={() => update({ [part.key]: undefined })} className="text-sm underline underline-offset-4 disabled:opacity-40">Reset this part</button>
      </div>
    </section>
  )
}
