"use client"

import { useState } from "react"
import { Droplets, ImagePlus, Palette, Sparkles } from "lucide-react"

import { FilmPicker } from "@/components/studio/film-picker"
import { cn } from "@/lib/utils"
import { allowedKinds, getTreatment, setTreatment, type BuilderRegion } from "@/lib/configurator/regions"
import { BESPOKE_PRINT_FILM, defaultCarbonFilm, pickableFilms } from "@/lib/configurator/helmet-configuration"
import { formatSurcharge, optionPriceLabel } from "@/lib/format"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, PartKind, RegionTreatment } from "@/types/configurator"

import { LogoUpload, type UploadCopy } from "./logo-upload"
import { SwatchGrid } from "./swatch-grid"

const printCopy: UploadCopy = {
  title: "Your artwork",
  action: "Upload your print",
  hint: "A high-resolution PNG or JPG works best. Up to 5 MB.",
  note: "We'll check the artwork and show it on your proof before printing.",
  noun: "print",
}

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
  /** Where to come back to after logging in to upload a print. */
  returnTo?: string
  /** Told an uploaded print's link, so the 3D preview can show it. */
  onImageUrl?: (path: string, url: string) => void
}

const materialMeta: Record<Exclude<PartKind, "film">, { label: string; hint: string; icon: typeof Palette }> = {
  colour: { label: "Solid", hint: "A single flat colour.", icon: Palette },
  metallic: { label: "Metallic", hint: "Metal flake through the colour.", icon: Sparkles },
  chrome: { label: "Chrome", hint: "Polished in-house chrome.", icon: Sparkles },
}

export function RegionStep({ mode, regions, priceBook, config, update, returnTo = "/helmet-builder", onImageUrl }: RegionStepProps) {
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
  const carbon = defaultCarbonFilm(priceBook)
  const bespoke = region.allowsFilm ? priceBook.films.find((film) => film.id === BESPOKE_PRINT_FILM && film.textureUrl) : undefined
  // Only offer a material the workshop has actually set up. Without a row in the price
  // list there's nothing to charge and checkout would reject the build.
  const kinds = allowedKinds(region)
    .filter((kind): kind is Exclude<PartKind, "film"> => kind !== "film")
    .filter((kind) => kind === "colour" || priceBook.options.material.some((item) => item.value === kind && item.isActive))

  const apply = (changes: RegionTreatment) => update(setTreatment(config, region.key, changes))

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
        <>
          {treatment?.kind === "film" && (
            <p className="flex gap-2 rounded-xl bg-paddock/50 p-3 text-xs text-muted-foreground">
              <Droplets className="size-4 shrink-0 text-brand-ink" aria-hidden />
              {treatment.value === BESPOKE_PRINT_FILM ? "Your own print" : (films.find((film) => film.id === treatment.value)?.name ?? "A film")} is on
              this part. Pick a colour to paint it instead.
            </p>
          )}
          <SwatchGrid
            label={/colour/i.test(region.label) ? region.label : `${region.label} colour`}
            options={colours}
            value={treatment?.kind === "colour" || treatment?.kind === "metallic" ? treatment.value : undefined}
            onChange={(value) => apply({ kind: treatment?.kind === "metallic" ? "metallic" : "colour", value })}
            size="lg"
          />
          {mode === "colour" && carbon && region.allowsFilm && (
            <button
              type="button"
              onClick={() => apply({ kind: "film", value: carbon.id })}
              aria-pressed={treatment?.kind === "film" && treatment.value === carbon.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                treatment?.kind === "film" && treatment.value === carbon.id
                  ? "border-brand-ink ring-2 ring-brand-ink/20"
                  : "border-carbon/15 hover:border-carbon/35",
              )}
            >
              <span
                aria-hidden
                className="size-10 shrink-0 rounded-xl bg-cover bg-center ring-1 ring-carbon/20"
                style={{ backgroundImage: `url(${carbon.thumbUrl ?? carbon.textureUrl})` }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Make it carbon</span>
                <span className="block text-xs text-muted-foreground">Carbon fibre film on the {region.label.toLowerCase()} instead of paint.</span>
              </span>
              <span className="text-xs font-semibold text-brand-ink">{formatSurcharge(carbon.price)}</span>
            </button>
          )}
        </>
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
          {bespoke && (
            <div className="space-y-2 rounded-2xl border border-carbon/15 p-4">
              <p className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <ImagePlus className="size-4 text-brand-ink" aria-hidden />
                  Your own print on the {region.label.toLowerCase()}
                </span>
                <span className="text-xs font-semibold text-brand-ink">{formatSurcharge(bespoke.price)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Upload a pattern, photo or artwork and we&apos;ll print it as a hydro-dip film for this part.
              </p>
              <LogoUpload
                key={region.key}
                path={treatment?.kind === "film" && treatment.value === BESPOKE_PRINT_FILM ? treatment.print : undefined}
                onChange={(path) =>
                  apply(path ? { kind: "film", value: BESPOKE_PRINT_FILM, print: path } : { kind: "colour", value: region.defaultColour })
                }
                onUrl={onImageUrl}
                returnTo={returnTo}
                copy={printCopy}
              />
            </div>
          )}
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
