"use client"

import { useState } from "react"
import { Droplets, Palette, Sparkles } from "lucide-react"

import { FilmPicker } from "@/components/studio/film-picker"
import { cn } from "@/lib/utils"
import { allowedKinds, getTreatment, setTreatment, type BuilderRegion } from "@/lib/configurator/regions"
import { pickableFilms } from "@/lib/configurator/helmet-configuration"
import { optionPriceLabel } from "@/lib/format"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, PartKind } from "@/types/configurator"

import { SwatchGrid } from "./swatch-grid"

/**
 * Steps 4 to 7 are the same job on different parts of the design: choose a region, then
 * give it a treatment. Keeping them one component means a template with eight editable
 * areas works exactly as well as one with two, and the steps can't drift apart.
 */
export type RegionMode = "colour" | "material" | "film" | "pinstripe"

interface RegionStepProps {
  mode: RegionMode
  regions: BuilderRegion[]
  priceBook: PriceBook
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
}

const materialMeta: Record<Exclude<PartKind, "film">, { label: string; hint: string; icon: typeof Palette }> = {
  colour: { label: "Solid", hint: "A single flat colour.", icon: Palette },
  metallic: { label: "Metallic", hint: "Metal flake through the colour.", icon: Sparkles },
  chrome: { label: "Chrome", hint: "Polished in-house chrome.", icon: Sparkles },
}

export function RegionStep({ mode, regions, priceBook, config, update }: RegionStepProps) {
  const list = mode === "pinstripe" ? regions.filter((r) => r.kind === "pinstripe") : regions.filter((r) => r.kind !== "pinstripe")
  const usable = mode === "film" ? list.filter((region) => region.allowsFilm) : list
  const [activeKey, setActiveKey] = useState(usable[0]?.key ?? "")

  // Falls back rather than syncing state: a template change can retire the chosen region.
  const region = usable.find((item) => item.key === activeKey) ?? usable[0]
  if (!region) {
    return (
      <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
        {mode === "pinstripe"
          ? "This template has no pinstripes to colour."
          : mode === "film"
            ? "No part of this template can take a hydro-dip film."
            : "This template has no editable areas yet."}
      </p>
    )
  }

  const treatment = getTreatment(config, region.key)
  const colours = priceBook.options.base.filter((option) => option.isActive)
  const films = pickableFilms(priceBook)
  // Only offer a material the workshop has actually set up. Without a row in the price
  // list there's nothing to charge and checkout would reject the build.
  const kinds = allowedKinds(region)
    .filter((kind): kind is Exclude<PartKind, "film"> => kind !== "film")
    .filter((kind) => kind === "colour" || priceBook.options.material.some((item) => item.value === kind && item.isActive))

  const apply = (changes: { kind: PartKind; value: string }) => update(setTreatment(config, region.key, changes))

  return (
    <div className="space-y-5">
      {usable.length > 1 && (
        <fieldset>
          <legend className="sr-only">Choose a part of the design</legend>
          <div className="flex flex-wrap gap-2">
            {usable.map((item) => {
              const itemTreatment = getTreatment(config, item.key)
              const selected = item.key === region.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveKey(item.key)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    selected ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 bg-card hover:border-carbon/35",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full ring-1 ring-carbon/20"
                    style={{ backgroundColor: itemTreatment?.value?.startsWith("#") ? itemTreatment.value : item.defaultColour }}
                  />
                  {item.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {region.hint && <p className="text-sm text-muted-foreground">{region.hint}</p>}

      {(mode === "colour" || mode === "pinstripe") && (
        <SwatchGrid
          label={`${region.label} colour`}
          options={colours}
          value={treatment?.kind === "colour" || treatment?.kind === "metallic" ? treatment.value : undefined}
          onChange={(value) => apply({ kind: treatment?.kind === "metallic" ? "metallic" : "colour", value })}
          size="lg"
        />
      )}

      {mode === "material" && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">{region.label} paint</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {kinds.map((kind) => {
              const meta = materialMeta[kind]
              const option = kind === "colour" ? null : priceBook.options.material.find((item) => item.value === kind && item.isActive)
              const selected = treatment?.kind === kind
              const Icon = meta.icon
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() =>
                    apply({
                      kind,
                      // Chrome has no colour of its own; the others keep the one already chosen.
                      value: kind === "chrome" ? "chrome" : treatment?.value?.startsWith("#") ? treatment.value : region.defaultColour,
                    })
                  }
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition",
                    selected ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-brand-ink" aria-hidden />
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{meta.hint}</span>
                  {option && option.price !== null && <span className="text-xs font-semibold text-brand-ink">{optionPriceLabel(option.price)}</span>}
                </button>
              )
            })}
          </div>
          {(treatment?.kind === "metallic" || treatment?.kind === "chrome") && (
            <p className="rounded-xl bg-paddock/50 p-3 text-xs text-muted-foreground">
              Metallic and chrome are lacquered gloss, so the overall finish is set to gloss at step 8.
            </p>
          )}
        </fieldset>
      )}

      {mode === "film" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => apply({ kind: "colour", value: region.defaultColour })}
              aria-pressed={treatment?.kind !== "film"}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                treatment?.kind !== "film" ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
              )}
            >
              <Palette className="mr-1.5 inline size-3.5" aria-hidden />
              No film
            </button>
            <span className="text-xs text-muted-foreground">
              <Droplets className="mr-1 inline size-3.5" aria-hidden />
              Films and paint can sit on different parts of the same helmet.
            </span>
          </div>
          <FilmPicker
            films={films}
            value={treatment?.kind === "film" ? treatment.value : ""}
            onChange={(filmId) => apply({ kind: "film", value: filmId })}
          />
        </div>
      )}
    </div>
  )
}
