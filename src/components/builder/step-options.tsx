"use client"

import { useRouter } from "next/navigation"
import { Box, Check, Ruler } from "lucide-react"

import { usePricesHidden } from "@/components/builder/prices-context"
import { finishLabels, trimParts } from "@/lib/configurator/helmet-configuration"
import { formatMoney, formatSurcharge } from "@/lib/format"
import { get3dModel } from "@/lib/helmet-3d/models"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { FinishId, HelmetConfiguration } from "@/types/configurator"
import type { HelmetModel } from "@/types/helmet"

import { SwatchGrid } from "./swatch-grid"
import { BellPartOptions } from "./bell-part-options"

type Update = (changes: Partial<HelmetConfiguration>) => void

/** A selectable card used by several steps. */
function ChoiceCard({
  checked,
  onSelect,
  name,
  disabled = false,
  children,
}: {
  checked: boolean
  onSelect: () => void
  name: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <label className={cn(disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="peer sr-only" />
      <span
        className={cn(
          "relative flex h-full flex-col gap-1 rounded-2xl border p-4 transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
          checked ? "border-brand-ink bg-accent/60" : "border-carbon/15 bg-card hover:border-carbon/40",
          disabled && "opacity-45",
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

/**
 * Part of step 1: we supply a brand-new shell, or the customer sends their own.
 * Only shown when the workshop has the "send my own helmet" route switched on.
 */
export function StepRoute({ priceBook, config, update }: { priceBook: PriceBook; config: HelmetConfiguration; update: Update }) {
  const router = useRouter()
  const routes = priceBook.options.route.filter((option) => option.isActive)
  const model = priceBook.models.find((item) => item.id === config.model)
  if (routes.length < 2) return null
  const current = config.route ?? "new"

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold">Who supplies the helmet?</legend>
      {routes.map((route) => (
        <ChoiceCard
          key={route.value}
          name="helmet-route"
          checked={current === route.value}
          // A customer's own helmet isn't designed here: they send photos and details for a quote.
          onSelect={() => (route.value === "own" ? router.push("/helmet-builder/own-helmet") : update({ v: "2", route: route.value as "new" | "own" }))}
        >
          <span className="font-semibold">{route.label}</span>
          {route.hint && <span className="text-xs text-muted-foreground">{route.hint}</span>}
          <span className="mt-auto pt-1 text-sm font-semibold text-brand-ink">
            {route.value === "new" && model ? formatMoney(model.newHelmetPrice) : route.value === "own" ? "Send photos for a quote →" : formatSurcharge(route.price) || "No extra charge"}
          </span>
        </ChoiceCard>
      ))}
    </fieldset>
  )
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

/**
 * Step 8. Metallic and chrome are lacquered gloss, so when any part of the design uses
 * one, the other finishes are locked and the reason is spelled out.
 */
export function StepFinish({
  priceBook,
  config,
  update,
  glossOnly = false,
}: {
  priceBook: PriceBook
  config: HelmetConfiguration
  update: Update
  glossOnly?: boolean
}) {
  const finishes = priceBook.options.finish.filter((option) => option.isActive && option.value in finishLabels)
  const pricesHidden = usePricesHidden()
  return (
    <div className="space-y-4">
      {glossOnly && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Your design uses metallic paint or a chrome base coat, which we finish in gloss to protect the flake and the
          mirror. Matte becomes available again with a standard base coat and no metallic parts.
        </p>
      )}
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="sr-only">Finish</legend>
        {finishes.map((finish) => (
          <ChoiceCard
            key={finish.value}
            name="finish"
            disabled={glossOnly && finish.value !== "gloss"}
            checked={config.finish === finish.value}
            onSelect={() => update({ finish: finish.value as FinishId })}
          >
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
            {!pricesHidden && <span className="mt-auto pt-1 text-sm font-semibold text-brand-ink">{formatSurcharge(finish.price) || "Included"}</span>}
          </ChoiceCard>
        ))}
      </fieldset>
      {config.baseKind === "chrome" && (
        <p className="text-xs text-muted-foreground">Your chrome shell keeps its mirror shine; the finish applies to the other parts.</p>
      )}
      <BaseCoat priceBook={priceBook} config={config} update={update} />
    </div>
  )
}

/**
 * What goes on the shell before the design. Over chrome, colours become candy colours with
 * a mirror behind them, and the clear parts of a film show the chrome.
 */
function BaseCoat({ priceBook, config, update }: { priceBook: PriceBook; config: HelmetConfiguration; update: Update }) {
  const pricesHidden = usePricesHidden()
  const chrome = priceBook.options.material.find((option) => option.value === "chrome" && option.isActive)
  if (!chrome) return null
  const coats = [
    { value: undefined, label: "Standard", hint: "A white base, so colours and films show exactly as chosen.", price: "Included" },
    {
      value: "chrome" as const,
      label: "Chrome",
      hint: "A mirror chrome base under your colours and films. Colours shine like candy and films show the chrome through their clear parts. Always gloss, and about three weeks longer in the workshop.",
      price: formatSurcharge(chrome.price) || "Included",
    },
  ]
  return (
    <fieldset className="space-y-3 border-t border-carbon/10 pt-4">
      <legend className="pt-4 text-sm font-semibold">Base coat</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {coats.map((coat) => (
          <ChoiceCard key={coat.label} name="base-coat" checked={config.baseCoat === coat.value} onSelect={() => update({ baseCoat: coat.value })}>
            <span
              aria-hidden
              className={cn(
                "mb-2 h-14 rounded-xl",
                coat.value ? "bg-[linear-gradient(135deg,#f4f6f8,#8d939b_45%,#eef1f4_55%,#6b7178)]" : "bg-[linear-gradient(135deg,#ffffff,#e9e8e2)] ring-1 ring-carbon/10",
              )}
            />
            <span className="font-semibold">{coat.label}</span>
            <span className="text-xs text-muted-foreground">{coat.hint}</span>
            {!pricesHidden && <span className="mt-auto pt-1 text-sm font-semibold text-brand-ink">{coat.price}</span>}
          </ChoiceCard>
        ))}
      </div>
    </fieldset>
  )
}

/** Step 11: rubber trims and, on the Bell KC7, its accessory colours. Spoilers are aero kits (step 3). */
export function StepTrims({ priceBook, config, update }: { priceBook: PriceBook; config: HelmetConfiguration; update: Update }) {
  const trims = priceBook.options.trim.filter((option) => option.isActive && option.value !== "bespoke")
  const bespoke = priceBook.options.trim.find((option) => option.value === "bespoke" && option.isActive)
  const pricesHidden = usePricesHidden()
  return (
    <div className="space-y-6">
      {/* Boxed like the accessories below, so it's clear which part a colour is for. */}
      <section aria-label="Rubber trims" className="space-y-4 rounded-2xl border border-carbon/15 p-4">
        <div>
          <h3 className="font-display text-xl font-bold uppercase">Rubber trims</h3>
          <p className="text-sm text-muted-foreground">The rubber around the visor opening and along the lower edge. Each has its own colour.</p>
        </div>
      {trimParts(config, priceBook).map((part) => (
        <div key={part.key} className="space-y-3 rounded-xl border border-carbon/10 bg-paper/40 p-3">
          <SwatchGrid
            label={part.key === "eyeportTrim" ? "Eyeport trim (around the visor opening)" : "Base trim (around the lower edge)"}
            options={trims}
            value={part.bespoke ? undefined : part.colour}
            onChange={(colour) => update({ [part.key]: colour })}
          />
          {bespoke && (
            <label className="flex flex-wrap items-center gap-3 text-sm">
              Any other colour
              <input
                type="color"
                aria-label={`${part.label} bespoke colour`}
                value={part.colour.startsWith("#") ? part.colour : "#111412"}
                onChange={(event) => update({ [part.key]: event.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-carbon/20"
              />
              {part.bespoke && <span className="font-mono text-xs">{part.colour.toUpperCase()}</span>}
              <span className="text-xs text-muted-foreground">{pricesHidden ? "Colour matched" : `Colour matched for ${formatSurcharge(bespoke.price) || "a quote"} fitted`}</span>
            </label>
          )}
        </div>
      ))}
      </section>
      {config.model === "bell-kc7" && <BellPartOptions config={config} priceBook={priceBook} update={update} />}
    </div>
  )
}
