"use client"

import { Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatOptionPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, VisorStrip } from "@/types/configurator"
import { helmetFonts } from "@/types/configurator"
import type { AeroKit, Visor } from "@/types/templates"

import { SwatchGrid } from "./swatch-grid"

interface UpdateProps {
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
}

/** A card in a single-choice list, with its price or "price on request". */
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
        <span className={cn("mt-1 block text-xs font-semibold", price === null ? "text-amber-700" : "text-brand-ink")}>
          {formatOptionPrice(price) || "Included"}
        </span>
      </span>
    </button>
  )
}

/** Step 2: the standard shell, or a spoiler that fits this helmet. */
export function StepAero({ aeroKits, config, update }: UpdateProps & { aeroKits: AeroKit[] }) {
  const kits = aeroKits.filter((kit) => kit.modelId === config.model)
  if (kits.length === 0) {
    return (
      <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
        No aero options are set up for this helmet yet. It will be built with the standard shell.
      </p>
    )
  }
  const current = config.aero ?? kits.find((kit) => !kit.meshName)?.id
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {kits.map((kit) => (
        <ChoiceCard
          key={kit.id}
          selected={current === kit.id}
          title={kit.name}
          summary={kit.summary}
          price={kit.price}
          onSelect={() => update({ v: "2", aero: kit.id, spoiler: kit.meshName ? "yes" : "no" })}
        />
      ))}
    </div>
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

/** Step 13: the printed band across the top of the visor. */
export function StepVisorStrip({ priceBook, config, update }: UpdateProps & { priceBook: PriceBook }) {
  const strip = config.visorStrip ?? defaultStrip
  const option = priceBook.options.visor_strip?.find((item) => item.value === "printed" && item.isActive)
  const colours = priceBook.options.base.filter((item) => item.isActive)
  const set = (changes: Partial<VisorStrip>) => update({ v: "2", visorStrip: { ...strip, ...changes } })

  return (
    <div className="space-y-5">
      <label className="flex items-start justify-between gap-4 rounded-2xl border border-carbon/15 p-4">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Add a visor strip</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            A printed band across the top of the visor, with your name, number or a sponsor.
          </span>
          {option && (
            <span className={cn("mt-1 block text-xs font-semibold", option.price === null ? "text-amber-700" : "text-brand-ink")}>
              {formatOptionPrice(option.price) || "Included"}
            </span>
          )}
        </span>
        <Switch checked={strip.enabled} onCheckedChange={(enabled) => set({ enabled })} aria-label="Add a visor strip" />
      </label>

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

          <SwatchGrid label="Strip colour" options={colours} value={strip.colour} onChange={(colour) => set({ colour })} />
          <SwatchGrid label="Text colour" options={colours} value={strip.textColour} onChange={(textColour) => set({ textColour })} />

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Lettering</legend>
            <div className="flex flex-wrap gap-2">
              {helmetFonts.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => set({ font })}
                  aria-pressed={strip.font === font}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm capitalize transition",
                    strip.font === font ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
                  )}
                >
                  {font}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  )
}
