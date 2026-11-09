"use client"

import { Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { pickableFilms, selectedSpoilers } from "@/lib/configurator/helmet-configuration"
import { FilmPicker } from "@/components/studio/film-picker"
import { optionPriceLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, SpoilerFinish, VisorStrip } from "@/types/configurator"
import { helmetFontStyles } from "@/components/helmet-3d/helmet-fonts"
import type { AeroKit, Visor } from "@/types/templates"

import { ColourChooser } from "./region-step"
import { SwatchGrid } from "./swatch-grid"

interface UpdateProps {
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
}

/** A card in a single-choice list, with its price (nothing while it has none). */
function ChoiceCard({
  selected,
  title,
  summary,
  price,
  swatch,
  onSelect,
}: {
  selected: boolean
  title: string
  summary?: string | null
  price: number | null
  swatch?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3 text-left transition",
        selected ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
      )}
    >
      {swatch && <span aria-hidden className="mt-0.5 size-7 shrink-0 rounded-full ring-1 ring-carbon/20" style={{ backgroundColor: swatch }} />}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {selected && <Check className="size-4 text-brand-ink" aria-hidden />}
        </span>
        {summary && <span className="mt-0.5 block text-xs text-muted-foreground">{summary}</span>}
        {price !== null && <span className="mt-1 block text-xs font-semibold text-brand-ink">{optionPriceLabel(price)}</span>}
      </span>
    </button>
  )
}

/** Step 2: the standard shell, or a spoiler that fits this helmet. */
export function StepAero({ aeroKits, priceBook, config, update }: UpdateProps & { aeroKits: AeroKit[]; priceBook: PriceBook }) {
  const kits = aeroKits.filter((kit) => kit.modelId === config.model)
  if (kits.length === 0) {
    return (
      <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
        No aero options are set up for this helmet yet. It will be built with the standard shell.
      </p>
    )
  }
  const standard = kits.find((kit) => !kit.meshName)
  const spoilerKits = kits.filter((kit) => kit.meshName)
  const chosen = selectedSpoilers(config, aeroKits).map((kit) => kit.id)
  // The standard aero stays the base kit; spoilers are fitted on top of it, any number together.
  const setSpoilers = (ids: string[]) =>
    update({ v: "2", aero: standard?.id ?? config.aero, spoilers: ids, spoiler: ids.length > 0 ? "yes" : "no" })

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {standard && (
          <ChoiceCard selected={chosen.length === 0} title="No spoilers" summary={standard.summary} price={standard.price} onSelect={() => setSpoilers([])} />
        )}
        {spoilerKits.map((kit) => (
          <ChoiceCard
            key={kit.id}
            selected={chosen.includes(kit.id)}
            title={kit.name}
            summary={kit.summary}
            price={kit.price}
            onSelect={() => setSpoilers(chosen.includes(kit.id) ? chosen.filter((id) => id !== kit.id) : [...chosen, kit.id])}
          />
        ))}
      </div>
      {spoilerKits.length > 1 && <p className="text-xs text-muted-foreground">Choose as many spoilers as you like; they can be fitted together.</p>}
      {chosen.length > 0 && (
        <SpoilerFinishPicker priceBook={priceBook} value={config.spoilerFinish} count={chosen.length} onChange={(spoilerFinish) => update({ spoilerFinish })} />
      )}
    </div>
  )
}

/** The spoilers' finish, priced per spoiler, with an optional chrome base coat under it. */
function SpoilerFinishPicker({
  priceBook,
  value,
  count,
  onChange,
}: {
  priceBook: PriceBook
  value: SpoilerFinish | undefined
  count: number
  onChange: (value: SpoilerFinish | undefined) => void
}) {
  const options = (priceBook.options.spoiler_finish ?? []).filter((option) => option.isActive)
  const price = (kind: string) => options.find((option) => option.value === kind)?.price ?? null
  const colours = priceBook.options.base.filter((option) => option.isActive)
  const films = pickableFilms(priceBook)
  const kinds: { kind: SpoilerFinish["kind"]; label: string }[] = [
    { kind: "matched", label: "Matched to the helmet design" },
    { kind: "colour", label: "Colour" },
    { kind: "metallic", label: "Metallic colour" },
    { kind: "film", label: "Film" },
  ]
  const choose = (kind: SpoilerFinish["kind"]) =>
    onChange({
      kind,
      value: kind === "film" ? (films.find((film) => film.id === value?.value)?.id ?? films[0]?.id ?? "") : value?.value?.startsWith("#") ? value.value : (colours[0]?.value ?? "#ffffff"),
      ...(value?.chrome ? { chrome: true } : {}),
    })
  const chromePrice = price("chrome")

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Spoiler finish{count > 1 ? `, for all ${count} spoilers` : ""}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <ChoiceCard selected={!value} title="Clear" summary="As supplied." price={0} onSelect={() => onChange(undefined)} />
        {kinds
          .filter((item) => options.some((option) => option.value === item.kind))
          .map((item) => (
            <ChoiceCard
              key={item.kind}
              selected={value?.kind === item.kind}
              title={item.label}
              summary={item.kind === "matched" ? "We carry your helmet's lines and colours onto the spoiler. Our most popular choice." : count > 1 ? "Price per spoiler." : null}
              price={price(item.kind)}
              onSelect={() => choose(item.kind)}
            />
          ))}
      </div>
      {(value?.kind === "colour" || value?.kind === "metallic") && (
        <ColourChooser label="Spoiler colour" options={colours} value={value.value} onChange={(colour) => onChange({ ...value, value: colour })} priceBook={priceBook} />
      )}
      {value?.kind === "film" && <FilmPicker films={films} value={value.value} onChange={(film) => onChange({ ...value, value: film })} />}
      {value && chromePrice !== null && (
        <label className="flex items-start justify-between gap-4 rounded-2xl border border-carbon/15 p-3">
          <span className="text-sm">
            <span className="block font-semibold">Chrome base coat</span>
            <span className="block text-xs text-muted-foreground">Chrome under the finish, so it shines through. {optionPriceLabel(chromePrice)} per spoiler.</span>
          </span>
          <Switch checked={Boolean(value.chrome)} onCheckedChange={(chrome) => onChange({ ...value, chrome: chrome || undefined })} aria-label="Chrome base coat" />
        </label>
      )}
    </fieldset>
  )
}

/** Step 12: visors for this helmet. */
export function StepVisor({ visors, config, update }: UpdateProps & { visors: Visor[] }) {
  const options = visors.filter((visor) => visor.modelId === config.model)
  if (options.length === 0) {
    return (
      <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
        No visor options are set up for this helmet yet. It comes with the standard clear visor.
      </p>
    )
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((visor) => (
        <ChoiceCard
          key={visor.id}
          selected={config.visor === visor.id}
          title={visor.name}
          summary={visor.kind === "iridium" ? "Mirrored iridium finish" : visor.kind === "smoked" ? "Tinted for bright days" : null}
          price={visor.price}
          swatch={visor.tint}
          onSelect={() => update({ v: "2", visor: visor.id })}
        />
      ))}
    </div>
  )
}

const defaultStrip: VisorStrip = { enabled: false, colour: "#101114", text: "", textColour: "#ffffff", font: "racing" }

/** Step 13: the free Lucas Racing visor sticker, or a bespoke one matched to the design. */
export function StepVisorStrip({ priceBook, config, update }: UpdateProps & { priceBook: PriceBook }) {
  const strip = config.visorStrip ?? defaultStrip
  const option = priceBook.options.visor_strip?.find((item) => item.value === "printed" && item.isActive)
  const holographic = priceBook.options.visor_strip?.find((item) => item.value === "holographic" && item.isActive)
  const colours = priceBook.options.base.filter((item) => item.isActive)
  const set = (changes: Partial<VisorStrip>) => update({ v: "2", visorStrip: { ...strip, ...changes } })

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <ChoiceCard
          selected={!strip.enabled}
          title="Lucas Racing sticker"
          summary="Our holographic visor sticker, free with every helmet we make."
          price={0}
          onSelect={() => set({ enabled: false })}
        />
        {option && (
          <ChoiceCard
            selected={strip.enabled}
            title="Bespoke sticker"
            summary={`Designed to match your helmet, with your name, number or sponsor.${holographic?.price ? ` Holographic ${optionPriceLabel((option.price ?? 0) + holographic.price).replace("+", "")}.` : ""}`}
            price={option.price}
            onSelect={() => set({ enabled: true })}
          />
        )}
      </div>

      {strip.enabled && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="visor-strip-text" className="text-sm font-semibold">
              Text on the strip
            </label>
            <Input
              id="visor-strip-text"
              value={strip.text}
              maxLength={40}
              placeholder="e.g. LUCAS RACING"
              onChange={(event) => set({ text: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">Up to 40 characters. Leave it blank for a plain band.</p>
          </div>

          <ColourChooser label="Sticker colour" options={colours} value={strip.colour} onChange={(colour) => set({ colour, kind: undefined, film: undefined })} priceBook={priceBook} />
          {holographic && (
            <label className="flex items-start justify-between gap-4 rounded-2xl border border-carbon/15 p-3">
              <span className="text-sm">
                <span className="block font-semibold">Holographic</span>
                <span className="block text-xs text-muted-foreground">Printed on holographic film, tinted by your colour. {optionPriceLabel(holographic.price)}</span>
              </span>
              <Switch checked={Boolean(strip.holographic)} onCheckedChange={(on) => set({ holographic: on || undefined })} aria-label="Holographic sticker" />
            </label>
          )}
          <SwatchGrid label="Text colour" options={colours} value={strip.textColour} onChange={(textColour) => set({ textColour })} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Lettering</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {helmetFontStyles.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => set({ font: font.id })}
                  aria-pressed={strip.font === font.id}
                  aria-label={`${font.label} font`}
                  className={cn(
                    "truncate rounded-xl border px-2 py-2 text-base leading-none transition",
                    strip.font === font.id ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
                  )}
                  style={{ fontFamily: font.family, fontWeight: font.weight, fontStyle: font.italic ? "italic" : "normal" }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  )
}
