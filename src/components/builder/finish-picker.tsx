"use client"

import { FilmPicker } from "@/components/studio/film-picker"
import { pickableFilms } from "@/lib/configurator/helmet-configuration"
import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { PartKind, RegionTreatment } from "@/types/configurator"

import { SwatchGrid } from "./swatch-grid"

interface FinishPickerProps {
  /** Names the part in headings, e.g. "Spoiler". */
  label: string
  priceBook: PriceBook
  /** Null is the part as supplied. */
  value: RegionTreatment | null
  onChange: (value: RegionTreatment | null) => void
  /** When set, offers leaving the part as supplied, e.g. "Clear". */
  asSupplied?: string
}

const kindLabels: Record<PartKind, string> = { colour: "Colour", film: "Film", chrome: "Chrome", metallic: "Metallic" }

/** Colour, hydro-dip film, chrome or metallic for a fitting such as a spoiler or visor strip. */
export function FinishPicker({ label, priceBook, value, onChange, asSupplied }: FinishPickerProps) {
  const colours = priceBook.options.base.filter((option) => option.isActive)
  const films = pickableFilms(priceBook)
  const material = (kind: PartKind) => priceBook.options.material.find((option) => option.value === kind && option.isActive)
  const firstColour = colours[0]?.value ?? "#ffffff"
  const currentColour = value?.value.startsWith("#") ? value.value : firstColour

  const kinds = (["colour", "film", "metallic", "chrome"] as PartKind[]).filter((kind) => kind === "colour" || kind === "film" || material(kind))
  const select = (kind: PartKind) => {
    if (kind === "film") onChange({ kind, value: films.find((film) => film.id === value?.value)?.id ?? films[0]?.id ?? "" })
    else if (kind === "chrome") onChange({ kind, value: "chrome" })
    else onChange({ kind, value: currentColour })
  }

  const tabClass = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm transition",
      selected ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
    )

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{label} finish</legend>
        <div className="flex flex-wrap gap-2">
          {asSupplied && (
            <button type="button" aria-pressed={!value} onClick={() => onChange(null)} className={tabClass(!value)}>
              {asSupplied}
            </button>
          )}
          {kinds.map((kind) => {
            const surcharge = kind === "chrome" || kind === "metallic" ? formatSurcharge(material(kind)?.price) : ""
            return (
              <button key={kind} type="button" aria-pressed={value?.kind === kind} onClick={() => select(kind)} className={tabClass(value?.kind === kind)}>
                {kindLabels[kind]}
                {surcharge && <span className="ml-1 text-xs opacity-75">{surcharge}</span>}
              </button>
            )
          })}
        </div>
      </fieldset>

      {(value?.kind === "colour" || value?.kind === "metallic") && (
        <SwatchGrid label={`${label} colour`} options={colours} value={value.value} onChange={(colour) => onChange({ kind: value.kind, value: colour })} />
      )}
      {value?.kind === "film" && <FilmPicker films={films} value={value.value} onChange={(film) => onChange({ kind: "film", value: film })} />}
    </div>
  )
}
