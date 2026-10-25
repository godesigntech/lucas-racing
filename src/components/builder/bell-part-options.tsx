"use client"

import { useState } from "react"

import { bellParts, type BellPartKey } from "@/lib/helmet-3d/parts"
import type { HelmetConfiguration } from "@/types/configurator"
import type { PriceBook } from "@/types/catalog"
import { SwatchGrid } from "./swatch-grid"

export function BellPartOptions({ config, priceBook, update }: {
  config: HelmetConfiguration
  priceBook: PriceBook
  update: (changes: Partial<HelmetConfiguration>) => void
}) {
  const [selected, setSelected] = useState<BellPartKey>("eyeportTrim")
  const part = bellParts.find(({ key }) => key === selected)!
  const colour = config[selected] ?? part.defaultColour ?? config.trim
  const palette = priceBook.options.base.filter((option) => option.isActive).map((option) => ({ ...option, price: 0 }))
  if (!palette.some((option) => option.value === colour)) {
    palette.push({ group: "base", value: colour, label: "Custom", swatch: colour, price: 0, hint: null, isActive: true, sortOrder: palette.length })
  }

  return (
    <section aria-label="Bell KC7 accessories" className="space-y-4 rounded-2xl border border-carbon/15 p-4">
      <div>
        <h3 className="font-display text-xl font-bold uppercase">Bell KC7 accessories</h3>
        <p className="text-sm text-muted-foreground">Choose a part, then its colour. Each part changes independently in 3D.</p>
      </div>
      <div role="group" aria-label="Accessory part" className="grid grid-cols-2 gap-2">
        {bellParts.map((item) => (
          <button type="button" key={item.key} aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium ${selected === item.key ? "border-brand-ink bg-accent" : "border-carbon/15"}`}>
            <span aria-hidden className="size-4 shrink-0 rounded-full border border-carbon/20" style={{ backgroundColor: config[item.key] ?? item.defaultColour ?? config.trim }} />
            {item.label}
          </button>
        ))}
        <button type="button" disabled className="rounded-xl border border-dashed border-carbon/20 p-3 text-left text-sm text-muted-foreground">BulletZ · unavailable</button>
      </div>
      <p className="text-xs text-muted-foreground">BulletZ accessories are not included in this model yet.</p>
      <div className="space-y-3 border-t border-carbon/10 pt-4">
        <p className="text-sm text-muted-foreground">{part.hint}</p>
        <SwatchGrid label={`${part.label} colour`} options={palette} value={colour} onChange={(value) => update({ [selected]: value })} />
        <label className="flex items-center gap-3 text-sm">
          Custom colour
          <input aria-label={`${part.label} custom colour`} type="color" value={colour} onChange={(event) => update({ [selected]: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-carbon/20" />
          <span className="font-mono text-xs">{colour.toUpperCase()}</span>
        </label>
        <button type="button" disabled={!config[selected]} onClick={() => update({ [selected]: undefined })} className="text-sm underline underline-offset-4 disabled:opacity-40">Reset this part</button>
      </div>
      <p className="rounded-xl bg-paper p-3 text-xs text-muted-foreground">Individual accessory colours are quoted by the workshop. You can share or save your design and send an enquiry. Reset these colours to use standard pricing.</p>
    </section>
  )
}
