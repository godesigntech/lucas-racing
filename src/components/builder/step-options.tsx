"use client"

import { Box, Check, Ruler } from "lucide-react"

import { finishLabels } from "@/lib/configurator/helmet-configuration"
import { formatMoney, formatSurcharge } from "@/lib/format"
import { get3dModel } from "@/lib/helmet-3d/models"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { FinishId, HelmetConfiguration } from "@/types/configurator"
import type { HelmetModel } from "@/types/helmet"

import { SwatchGrid } from "./swatch-grid"

type Update = (changes: Partial<HelmetConfiguration>) => void

/** A selectable card used by several steps. */
function ChoiceCard({
  checked,
  onSelect,
  name,
  children,
}: {
  checked: boolean
  onSelect: () => void
  name: string
  children: React.ReactNode
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={cn(
          "relative flex h-full flex-col gap-1 rounded-2xl border p-4 transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
          checked ? "border-brand-ink bg-accent/60" : "border-carbon/15 bg-card hover:border-carbon/40",
        )}
      >
        {checked && (
          <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-ink text-paper">
            <Check className="size-3" aria-hidden />
          </span>
        )}
        {children}
      </span>
    </label>
  )
}

export function StepHelmet({ models, config, update }: { models: HelmetModel[]; config: HelmetConfiguration; update: Update }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Helmet</legend>
      {models.map((model) => (
        <ChoiceCard key={model.id} name="helmet-model" checked={model.id === config.model} onSelect={() => update({ model: model.id })}>
          <span className="text-xs text-muted-foreground">{model.brand}</span>
          <span className="font-display text-2xl font-bold uppercase leading-tight">{model.name}</span>
          <span className="text-sm text-muted-foreground">{model.summary}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">+{formatMoney(model.newHelmetPrice)}</span>
            <span className="text-muted-foreground">new helmet</span>
            {get3dModel(model.id) && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-carbon px-2 py-0.5 text-[0.68rem] font-semibold text-brand">
                <Box className="size-3" aria-hidden /> 3D preview
              </span>
            )}
          </span>
        </ChoiceCard>
      ))}
    </fieldset>
  )
}

/** Typical head circumference for each helmet size. */
const sizeGuide: Record<string, string> = {
  XXS: "51–52 cm",
  XS: "53–54 cm",
  S: "55–56 cm",
  M: "57–58 cm",
  L: "59–60 cm",
  XL: "61–62 cm",
  XXL: "63–64 cm",
}

export function StepSize({ model, config, update }: { model: HelmetModel | undefined; config: HelmetConfiguration; update: Update }) {
  const sizes = model?.sizes ?? []
  return (
    <div className="space-y-5">
      <fieldset className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <legend className="sr-only">Helmet size</legend>
        {sizes.map((size) => (
          <label key={size} className="cursor-pointer">
            <input type="radio" name="helmet-size" checked={config.size === size} onChange={() => update({ size })} className="peer sr-only" />
            <span
              className={cn(
                "flex flex-col items-center rounded-2xl border px-2 py-3 text-center transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                config.size === size ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40",
              )}
            >
              <span className="font-display text-2xl font-bold leading-none">{size}</span>
              {sizeGuide[size] && <span className={cn("mt-1 text-[0.68rem]", config.size === size ? "text-paper/65" : "text-muted-foreground")}>{sizeGuide[size]}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="flex gap-2.5 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
        <Ruler className="mt-0.5 size-4 shrink-0" aria-hidden />
        Measure around your head about 2 cm above your eyebrows. Between sizes? Choose the smaller one, as helmets
        loosen with wear, or message us and we&apos;ll help.
      </p>
    </div>
  )
}

export function StepFinish({ priceBook, config, update }: { priceBook: PriceBook; config: HelmetConfiguration; update: Update }) {
  const finishes = priceBook.options.finish.filter((option) => option.isActive && option.value in finishLabels)
  return (
    <div className="space-y-4">
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="sr-only">Finish</legend>
        {finishes.map((finish) => (
          <ChoiceCard key={finish.value} name="finish" checked={config.finish === finish.value} onSelect={() => update({ finish: finish.value as FinishId })}>
            <span
              aria-hidden
              className={cn(
                "mb-2 h-14 rounded-xl bg-[linear-gradient(135deg,#1f5bd8,#14254d)]",
                finish.value === "gloss" && "shadow-[inset_0_10px_18px_-6px_rgb(255_255_255/0.75)]",
                finish.value === "satin" && "shadow-[inset_0_10px_18px_-8px_rgb(255_255_255/0.35)]",
                finish.value === "matte" && "saturate-75",
              )}
            />
            <span className="font-semibold">{finish.label}</span>
            <span className="text-xs text-muted-foreground">{finish.hint ?? (finish.value === "gloss" ? "Deep shine, easy to clean" : "")}</span>
            <span className="mt-auto pt-1 text-sm font-semibold text-brand-ink">{formatSurcharge(finish.price) || "Included"}</span>
          </ChoiceCard>
        ))}
      </fieldset>
      {config.baseKind === "chrome" && (
        <p className="text-xs text-muted-foreground">Your chrome shell keeps its mirror shine; the finish applies to the other parts.</p>
      )}
    </div>
  )
}

export function StepTrims({ priceBook, config, update }: { priceBook: PriceBook; config: HelmetConfiguration; update: Update }) {
  const trims = priceBook.options.trim.filter((option) => option.isActive)
  const spoilers = priceBook.options.spoiler.filter((option) => option.isActive)
  return (
    <div className="space-y-6">
      <SwatchGrid label="Rubber trim (eye-port and base)" options={trims} value={config.trim} onChange={(trim) => update({ trim })} size="lg" />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Rear spoiler</legend>
        <div className="grid grid-cols-2 gap-3">
          {spoilers.map((option) => (
            <ChoiceCard key={option.value} name="spoiler" checked={config.spoiler === option.value} onSelect={() => update({ spoiler: option.value as "yes" | "no" })}>
              <span className="font-semibold">{option.value === "yes" ? "Add a spoiler" : "No spoiler"}</span>
              <span className="text-sm text-brand-ink">{formatSurcharge(option.price) || "Included"}</span>
            </ChoiceCard>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
