"use client"

import { useState } from "react"
import { Droplets, Palette, Sparkles } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { FilmPicker } from "@/components/studio/film-picker"
import { describePart, partHints, partLabels, partOf, pickableFilms, templateParts } from "@/lib/configurator/helmet-configuration"
import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, PartId, PartKind } from "@/types/configurator"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

import { SwatchGrid } from "./swatch-grid"

interface StepPartsProps {
  product: CatalogProduct
  priceBook: PriceBook
  config: HelmetConfiguration
  look: HelmetLook
  update: (changes: Partial<HelmetConfiguration>) => void
}

const kindMeta: Record<PartKind, { label: string; icon: typeof Palette }> = {
  colour: { label: "Colour", icon: Palette },
  film: { label: "Hydro-dip film", icon: Droplets },
  chrome: { label: "Chrome", icon: Sparkles },
}

/** Pick a part (on the list or highlighted on the helmet), then paint it with a colour, film or chrome. */
export function StepParts({ product, priceBook, config, look, update }: StepPartsProps) {
  const parts = templateParts(product)
  const [part, setPart] = useState<PartId>("base")
  const current = partOf(config, part) ?? { kind: "colour" as const, value: "" }
  const palette = priceBook.options.base.filter((option) => option.isActive)
  const chrome = priceBook.options.material.find((option) => option.value === "chrome" && option.isActive)
  const kinds: PartKind[] = part === "base" && chrome ? ["colour", "film", "chrome"] : ["colour", "film"]

  // Remember the last colour and film per part, so switching kinds doesn't lose them.
  const [memory, setMemory] = useState<Partial<Record<`${PartId}-${PartKind}`, string>>>({})
  const films = pickableFilms(priceBook)

  function paint(kind: PartKind, value: string) {
    setMemory((previous) => ({ ...previous, [`${part}-${current.kind}`]: current.value }))
    if (part === "base") update({ baseKind: kind, base: value })
    else update({ [`${part}Kind`]: kind, [part]: value })
  }

  function switchKind(kind: PartKind) {
    if (kind === current.kind) return
    const remembered = memory[`${part}-${kind}`]
    if (kind === "chrome") paint("chrome", "chrome")
    else if (kind === "film") paint("film", remembered ?? films[0]?.id ?? "")
    else paint("colour", remembered ?? palette[0]?.value ?? "")
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-4">
        <div className="grid aspect-square place-items-center rounded-2xl sm:aspect-[4/3] bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] p-3">
          <HelmetArt look={look} highlight={part} title={`${product.name} with the ${partLabels[part].toLowerCase()} highlighted`} />
        </div>
        <ul className="space-y-2" role="listbox" aria-label="Helmet parts">
          {parts.map((id) => {
            const info = describePart(priceBook, config, id)
            const selected = id === part
            return (
              <li key={id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => setPart(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                    selected ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40",
                  )}
                >
                  <span
                    className="size-10 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-carbon/15"
                    style={{ backgroundColor: info?.colour, backgroundImage: info?.texture ? `url(${info.texture})` : undefined }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{partLabels[id]}</span>
                    <span className={cn("block truncate text-xs", selected ? "text-paper/65" : "text-muted-foreground")}>
                      {info?.label ?? "Not set"}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-4 rounded-2xl border border-carbon/10 p-4">
        <div>
          <p className="font-semibold">{partLabels[part]}</p>
          <p className="text-xs text-muted-foreground">{partHints[part]}</p>
        </div>

        <div role="radiogroup" aria-label={`${partLabels[part]} material`} className="grid gap-1 rounded-2xl bg-carbon/5 p-1" style={{ gridTemplateColumns: `repeat(${kinds.length}, minmax(0, 1fr))` }}>
          {kinds.map((kind) => {
            const Icon = kindMeta[kind].icon
            const active = current.kind === kind
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchKind(kind)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-all",
                  active ? "bg-card text-carbon shadow-sm ring-1 ring-carbon/10" : "text-muted-foreground hover:text-carbon",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="truncate">{kindMeta[kind].label}</span>
              </button>
            )
          })}
        </div>

        {current.kind === "colour" && (
          <SwatchGrid label={`${partLabels[part]} colour`} options={palette} value={current.value} onChange={(value) => paint("colour", value)} />
        )}
        {current.kind === "film" && (
          <FilmPicker
            films={priceBook.films}
            value={current.value}
            onChange={(id) => {
              const film = films.find((item) => item.id === id)
              if (film) paint("film", film.id)
              else paint("colour", memory[`${part}-colour`] ?? palette[0]?.value ?? "")
            }}
          />
        )}
        {current.kind === "chrome" && chrome && (
          <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
            Polished in-house chrome across the shell. Your graphic and pinstripe sit on top.
            <span className="ml-1 font-semibold">{formatSurcharge(chrome.price)}</span>
          </p>
        )}
      </div>
    </div>
  )
}
