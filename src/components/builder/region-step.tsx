"use client"

import { useState } from "react"
import { Hand } from "lucide-react"

import { FilmPicker } from "@/components/studio/film-picker"
import { cn } from "@/lib/utils"
import { getTreatment, setTreatment, type BuilderRegion } from "@/lib/configurator/regions"
import { BESPOKE_PRINT_FILM, colourName, holographicTapes, pickableFilms } from "@/lib/configurator/helmet-configuration"
import { formatSurcharge } from "@/lib/format"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, RegionTreatment } from "@/types/configurator"

import { LogoUpload, type UploadCopy } from "./logo-upload"
import { SwatchGrid } from "./swatch-grid"

const printCopy: UploadCopy = {
  title: "Your pattern",
  action: "Upload your pattern",
  hint: "It repeats across this part like a film. A high-resolution PNG or JPG works best. Up to 5 MB.",
  note: "We'll check the artwork and show it on your proof before printing.",
  noun: "pattern",
}

/**
 * Step 4 ("zones": colour, metallic, film or the customer's own pattern for each part of the
 * design) and step 6 ("pinstripe": the racing lines). Customers pick a part from the list or
 * by tapping it on the 3D helmet; whatever they chose last is the "brush" a tap applies.
 */
export type RegionMode = "zones" | "pinstripe"

interface RegionStepProps {
  mode: RegionMode
  regions: BuilderRegion[]
  priceBook: PriceBook
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
  /** The part being edited, shared with the 3D preview so tapping the helmet can change it. */
  activeKey: string
  onActiveKey: (key: string) => void
  /** Told each treatment the customer applies, so a tap on the helmet can apply it again. */
  onBrush?: (treatment: RegionTreatment) => void
  /** True when the template is a designer's full-colour artwork, which each part can go back to. */
  hasArtwork?: boolean
  /** Where to come back to after logging in to upload a pattern. */
  returnTo?: string
  /** Told an uploaded pattern's link, so the 3D preview can show it. */
  onImageUrl?: (path: string, url: string) => void
}

type Tab = "designed" | "colour" | "metallic" | "film" | "pattern" | "holographic"

export function RegionStep({
  mode,
  regions,
  priceBook,
  config,
  update,
  activeKey,
  onActiveKey,
  onBrush,
  hasArtwork = false,
  returnTo = "/helmet-builder",
  onImageUrl,
}: RegionStepProps) {
  // "Your own pattern" shows its upload before anything is uploaded, so it's remembered here.
  const [patternFor, setPatternFor] = useState<string | null>(null)
  const usable = mode === "pinstripe" ? regions.filter((region) => region.kind === "pinstripe") : regions.filter((region) => region.kind !== "pinstripe")
  // Falls back rather than syncing state: a template change can retire the chosen part.
  const region = usable.find((item) => item.key === activeKey) ?? usable[0]
  if (!region) {
    return (
      <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
        {mode === "pinstripe" ? "This template has no racing lines to colour." : "This template has no editable areas yet."}
      </p>
    )
  }

  const treatment = getTreatment(config, region.key)
  const colours = priceBook.options.base.filter((option) => option.isActive)
  const films = pickableFilms(priceBook)
  const tapes = holographicTapes(priceBook)
  const metallic = priceBook.options.material.find((option) => option.value === "metallic" && option.isActive)
  const bespoke = region.allowsFilm ? priceBook.films.find((film) => film.id === BESPOKE_PRINT_FILM && film.textureUrl) : undefined
  const asDesigned = hasArtwork && (!treatment || (treatment.kind === "colour" && treatment.value === region.defaultColour))

  const derivedTab: Tab = asDesigned
    ? "designed"
    : treatment?.kind === "film"
      ? treatment.value === BESPOKE_PRINT_FILM
        ? "pattern"
        : tapes.some((tape) => tape.id === treatment.value)
          ? "holographic"
          : "film"
      : treatment?.kind === "metallic"
        ? "metallic"
        : "colour"
  const tab: Tab = patternFor === region.key ? "pattern" : derivedTab

  const apply = (next: RegionTreatment) => {
    if (!(next.kind === "film" && next.value === BESPOKE_PRINT_FILM)) setPatternFor(null)
    update(setTreatment(config, region.key, next))
    onBrush?.(next)
  }
  const currentColour = treatment?.value?.startsWith("#") ? treatment.value : region.defaultColour

  const tabs: { id: Tab; label: string; price?: string; show: boolean; select: () => void }[] = [
    { id: "designed", label: "As designed", show: hasArtwork, select: () => apply({ kind: "colour", value: region.defaultColour }) },
    { id: "colour", label: mode === "pinstripe" ? "Tape colour" : "Colour", show: true, select: () => apply({ kind: "colour", value: asDesigned ? (colours.find((option) => option.value !== region.defaultColour)?.value ?? currentColour) : currentColour }) },
    { id: "metallic", label: "Metallic", price: formatSurcharge(metallic?.price), show: Boolean(metallic) && region.allowsMetallic, select: () => apply({ kind: "metallic", value: currentColour }) },
    { id: "film", label: "Film", show: region.allowsFilm && mode === "zones", select: () => apply({ kind: "film", value: films[0]?.id ?? "", under: undefined }) },
    {
      id: "holographic",
      label: "Holographic tape",
      price: formatSurcharge(tapes[0]?.price),
      show: mode === "pinstripe" && tapes.length > 0 && region.allowsFilm,
      select: () => apply({ kind: "film", value: tapes[0].id }),
    },
    { id: "pattern", label: "Your own pattern", price: formatSurcharge(bespoke?.price), show: Boolean(bespoke) && mode === "zones", select: () => setPatternFor(region.key) },
  ]

  return (
    <div className="space-y-5">
      {usable.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Choose a part</legend>
          <div className="flex flex-wrap gap-2">
            {usable.map((item) => {
              const itemTreatment = getTreatment(config, item.key)
              const selected = item.key === region.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onActiveKey(item.key)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    selected ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 bg-card hover:border-carbon/35",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-4 shrink-0 rounded-full ring-1 ring-carbon/20"
                    style={{ backgroundColor: itemTreatment?.value?.startsWith("#") ? itemTreatment.value : (itemTreatment?.under ?? item.defaultColour) }}
                  />
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hand className="size-3.5" aria-hidden /> Or tap a part on the helmet: it takes the colour or film you chose last.
          </p>
        </fieldset>
      )}

      {region.hint && <p className="text-sm text-muted-foreground">{region.hint}</p>}

      <div className="flex flex-wrap gap-2" role="group" aria-label={`${region.label} finish`}>
        {tabs
          .filter((item) => item.show)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={item.select}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                tab === item.id ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
              )}
            >
              {item.label}
              {item.price && <span className="ml-1 text-xs opacity-75">{item.price}</span>}
            </button>
          ))}
      </div>

      {(tab === "colour" || tab === "metallic") && (
        <ColourChooser
          label={`${region.label}: ${tab === "metallic" ? "metallic colour" : "colour"}`}
          options={colours}
          value={treatment?.value}
          onChange={(value) => apply({ kind: tab === "metallic" ? "metallic" : "colour", value })}
          priceBook={priceBook}
        />
      )}

      {tab === "film" && treatment?.kind === "film" && (
        <div className="space-y-4">
          <ColourChooser
            label="Colour underneath the film"
            hint="Films are printed on a clear sheet, so this colour shows through the pattern. White shows the film as it is."
            options={[{ group: "base", value: "#ffffff", label: "White", swatch: "#ffffff", price: 0, hint: null, isActive: true, sortOrder: -1 }, ...colours]}
            value={treatment.under ?? "#ffffff"}
            onChange={(under) => apply({ ...treatment, under: under === "#ffffff" ? undefined : under })}
            priceBook={priceBook}
          />
          <FilmPicker films={films} value={treatment.value} onChange={(filmId) => apply({ kind: "film", value: filmId, under: treatment.under })} />
        </div>
      )}

      {tab === "pattern" && bespoke && (
        <LogoUpload
          key={region.key}
          path={treatment?.kind === "film" && treatment.value === BESPOKE_PRINT_FILM ? treatment.print : undefined}
          onChange={(path) => apply(path ? { kind: "film", value: BESPOKE_PRINT_FILM, print: path } : { kind: "colour", value: region.defaultColour })}
          onUrl={onImageUrl}
          returnTo={returnTo}
          copy={printCopy}
        />
      )}

      {tab === "holographic" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Holographic tape colour</legend>
          <div className="flex flex-wrap gap-2">
            {tapes.map((tape) => (
              <button
                key={tape.id}
                type="button"
                aria-pressed={treatment?.value === tape.id}
                onClick={() => apply({ kind: "film", value: tape.id })}
                className={cn("flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm", treatment?.value === tape.id ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small static swatch */}
                <img src={tape.thumbUrl ?? tape.textureUrl ?? ""} alt="" className="size-7 rounded-full object-cover" />
                {tape.name.replace(/^Holographic /, "")}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {tab === "designed" && <p className="rounded-xl bg-paddock/50 p-3 text-sm text-muted-foreground">This part shows the designer&apos;s artwork. Choose a colour or film to change it.</p>}
    </div>
  )
}

/** The colour range as swatches, plus any colour at all, which the workshop matches. */
export function ColourChooser({
  label,
  hint,
  options,
  value,
  onChange,
  priceBook,
}: {
  label: string
  hint?: string
  options: PriceBook["options"]["base"]
  value: string | undefined
  onChange: (value: string) => void
  priceBook: PriceBook
}) {
  const custom = value && value.startsWith("#") && !options.some((option) => option.value === value)
  return (
    <div className="space-y-2">
      <SwatchGrid label={label} options={options} value={value} onChange={onChange} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <label className="flex flex-wrap items-center gap-3 text-sm">
        Any other colour
        <input
          type="color"
          aria-label={`${label}: any colour`}
          value={value?.startsWith("#") ? value : "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-carbon/20"
        />
        {custom && <span className="font-mono text-xs">{colourName(priceBook, value)}</span>}
        <span className="text-xs text-muted-foreground">We match it for you.</span>
      </label>
    </div>
  )
}
