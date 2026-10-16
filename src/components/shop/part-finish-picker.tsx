"use client"

import { Droplets, Paintbrush, Sparkles } from "lucide-react"

import { SwatchGrid } from "@/components/builder/swatch-grid"
import { FilmPicker } from "@/components/studio/film-picker"
import { formatSurcharge } from "@/lib/format"
import { finishChoices, finishLabels, type PartFinish } from "@/lib/shop/part-finish"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { FinishType } from "@/types/shop"

const icons: Record<FinishType, typeof Paintbrush> = { paint: Paintbrush, film: Droplets, chrome: Sparkles }

interface PartFinishPickerProps {
  allowed: FinishType[]
  priceBook: PriceBook
  value: PartFinish
  onChange: (finish: PartFinish) => void
}

/**
 * Choose how a part is finished: a paint colour, a hydro-dip film (the same library
 * as the helmets) or chrome, then the lacquer. Prices come from the helmet price list.
 */
export function PartFinishPicker({ allowed, priceBook, value, onChange }: PartFinishPickerProps) {
  const { colours, films, chrome, lacquers } = finishChoices(priceBook)
  const lacquer = value.lacquer || lacquers[0]?.value || ""

  function switchType(type: FinishType) {
    if (type === value.type) return
    if (type === "paint") onChange({ type, value: colours[0]?.value ?? "", lacquer })
    else if (type === "film") onChange({ type, value: films[0]?.id ?? "", lacquer })
    else onChange({ type, value: "chrome", lacquer: "" })
  }

  return (
    <div className="space-y-5 rounded-3xl border border-carbon/10 bg-card p-5">
      <div className="space-y-1">
        <p className="eyebrow text-brand-ink">Customise by HydroKarts</p>
        <p className="text-sm text-muted-foreground">Finished in our workshop with the same paints, films and chrome as our custom helmets.</p>
      </div>

      {allowed.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Finish"
          className="grid gap-1 rounded-2xl bg-carbon/5 p-1"
          style={{ gridTemplateColumns: `repeat(${allowed.length}, minmax(0, 1fr))` }}
        >
          {allowed.map((type) => {
            const Icon = icons[type]
            const active = value.type === type
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchType(type)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-all",
                  active ? "bg-card text-carbon shadow-sm ring-1 ring-carbon/10" : "text-muted-foreground hover:text-carbon",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="truncate">{finishLabels[type]}</span>
              </button>
            )
          })}
        </div>
      )}

      {value.type === "paint" && (
        <SwatchGrid label="Colour" options={colours} value={value.value} onChange={(colour) => onChange({ ...value, value: colour })} />
      )}
      {value.type === "film" && (
        <FilmPicker
          films={priceBook.films}
          value={value.value}
          onChange={(id) => {
            if (films.some((film) => film.id === id)) onChange({ ...value, value: id })
          }}
        />
      )}
      {value.type === "chrome" && chrome && (
        <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
          Polished in-house chrome.
          {formatSurcharge(chrome.price) && <span className="ml-1 font-semibold">{formatSurcharge(chrome.price)}</span>}
        </p>
      )}

      {value.type !== "chrome" && lacquers.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Lacquer</legend>
          <div className="flex flex-wrap gap-2">
            {lacquers.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="part-lacquer"
                  value={option.value}
                  checked={lacquer === option.value}
                  onChange={() => onChange({ ...value, lacquer: option.value })}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    lacquer === option.value ? "border-carbon bg-carbon text-paper" : "border-carbon/20 hover:border-carbon/50",
                  )}
                >
                  {option.label}
                  {formatSurcharge(option.price) && <span className="text-xs opacity-75">{formatSurcharge(option.price)}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
