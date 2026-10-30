"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react"

import { helmetFont, helmetFontStyles } from "@/components/helmet-3d/helmet-fonts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { logoPlacements, namePlacements, numberPlacements } from "@/lib/configurator/helmet-configuration"
import { formatOptionPrice } from "@/lib/format"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration, LogoPlacementItem, PersonalItem, PersonalKind } from "@/types/configurator"

import { LogoUpload } from "./logo-upload"
import { PlacementPicker } from "./placement-picker"

interface UpdateProps {
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
}

const kindMeta: Record<PersonalKind, { label: string; placeholder: string; maxLength: number; hint: string }> = {
  name: { label: "Name", placeholder: "e.g. C. LUCAS", maxLength: 24, hint: "Up to 24 characters." },
  number: { label: "Racing number", placeholder: "e.g. 42", maxLength: 3, hint: "Up to 3 letters or digits." },
  initials: { label: "Initials", placeholder: "e.g. CJL", maxLength: 3, hint: "Up to 3 letters." },
  flag: { label: "National flag", placeholder: "e.g. GBR", maxLength: 3, hint: "The country's three-letter code." },
  text: { label: "Custom text", placeholder: "Your words", maxLength: 24, hint: "Up to 24 characters." },
}

const placementsFor = (kind: PersonalKind) => (kind === "number" ? numberPlacements : namePlacements)

/** Step 9: names, numbers, initials, flags and free text. */
export function StepPersonalisation({ priceBook, config, update }: UpdateProps & { priceBook: PriceBook }) {
  const items = config.personalisation ?? []
  const colours = priceBook.options.base.filter((option) => option.isActive)
  const prices = priceBook.options.personalisation ?? []

  const setItems = (next: PersonalItem[]) => update({ v: "2", personalisation: next })
  const patch = (index: number, changes: Partial<PersonalItem>) =>
    setItems(items.map((item, position) => (position === index ? { ...item, ...changes } : item)))

  const add = (kind: PersonalKind) =>
    setItems([...items, { kind, value: "", position: placementsFor(kind)[0], font: "racing", scale: 1, rotation: 0 }])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(kindMeta) as PersonalKind[]).map((kind) => {
          const price = prices.find((option) => option.value === kind && option.isActive)
          return (
            <Button key={kind} type="button" variant="outline" size="sm" onClick={() => add(kind)} disabled={items.length >= 6}>
              <Plus /> {kindMeta[kind].label}
              {price && price.price !== null && price.price > 0 && (
                <span className="ml-1 text-xs font-semibold">{formatOptionPrice(price.price)}</span>
              )}
            </Button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-carbon/10 bg-paddock/40 p-4 text-sm text-muted-foreground">
          Nothing added yet. Personalisation is optional, and we place it on your proof for you to approve.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => {
            const meta = kindMeta[item.kind]
            return (
              <li key={`${item.kind}-${index}`} className="space-y-4 rounded-2xl border border-carbon/15 p-4">
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label htmlFor={`personal-${index}`} className="text-sm font-semibold">
                      {meta.label}
                    </label>
                    <Input
                      id={`personal-${index}`}
                      value={item.value}
                      maxLength={meta.maxLength}
                      placeholder={meta.placeholder}
                      onChange={(event) => patch(index, { value: event.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${meta.label.toLowerCase()}`}
                    onClick={() => setItems(items.filter((_, position) => position !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <PlacementPicker
                  label="Where it goes"
                  options={placementsFor(item.kind)}
                  value={item.position}
                  onChange={(position) => patch(index, { position })}
                />

                <FinePosition
                  id={`personal-${index}`}
                  x={item.offsetX ?? 0}
                  y={item.offsetY ?? 0}
                  onChange={(offsetX, offsetY) => patch(index, { offsetX, offsetY })}
                />

                {item.kind !== "flag" && (
                  <>
                    <LetteringPreview item={item} />

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-semibold">Font</legend>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {helmetFontStyles.map((font) => {
                          const selected = (item.font ?? "racing") === font.id
                          return (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => patch(index, { font: font.id })}
                              aria-pressed={selected}
                              aria-label={`${font.label} font`}
                              className={cn(
                                "truncate rounded-xl border px-2 py-2 text-base leading-none transition",
                                selected ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
                              )}
                              style={{ fontFamily: font.family, fontWeight: font.weight, fontStyle: font.italic ? "italic" : "normal" }}
                            >
                              {font.label}
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-semibold">Style</legend>
                      <div className="flex flex-wrap gap-2">
                        <ToggleChip pressed={Boolean(item.bold)} onClick={() => patch(index, { bold: !item.bold })}>
                          <span className="font-bold">Bold</span>
                        </ToggleChip>
                        <ToggleChip
                          pressed={item.italic ?? helmetFont(item.font).italic}
                          onClick={() => patch(index, { italic: !(item.italic ?? helmetFont(item.font).italic) })}
                        >
                          <span className="italic">Italic</span>
                        </ToggleChip>
                      </div>
                    </fieldset>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Slider label="Size" min={0.5} max={2} step={0.1} value={item.scale ?? 1} onChange={(scale) => patch(index, { scale })} />
                      <Slider label="Angle" min={-45} max={45} step={1} value={item.rotation ?? 0} onChange={(rotation) => patch(index, { rotation })} />
                      <Slider
                        label="Letter spacing"
                        min={-0.1}
                        max={0.5}
                        step={0.02}
                        value={item.letterSpacing ?? 0}
                        onChange={(letterSpacing) => patch(index, { letterSpacing })}
                      />
                    </div>

                    <ColourChoice label="Colour" colours={colours} value={item.colour} onChange={(colour) => patch(index, { colour })} />

                    <fieldset className="space-y-3 rounded-xl bg-paddock/40 p-3">
                      <legend className="sr-only">Outline</legend>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">Outline</span>
                        <ToggleChip
                          pressed={Boolean(item.outline)}
                          onClick={() =>
                            patch(index, item.outline ? { outline: undefined, outlineWidth: 0 } : { outline: "#111412", outlineWidth: item.outlineWidth || 0.08 })
                          }
                        >
                          {item.outline ? "On" : "Off"}
                        </ToggleChip>
                      </div>
                      {item.outline && (
                        <>
                          <ColourChoice label="Outline colour" colours={colours} value={item.outline} onChange={(outline) => patch(index, { outline })} />
                          <Slider
                            label="Outline thickness"
                            min={0.02}
                            max={0.3}
                            step={0.01}
                            value={item.outlineWidth ?? 0.08}
                            onChange={(outlineWidth) => patch(index, { outlineWidth })}
                          />
                        </>
                      )}
                    </fieldset>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const HEX = /^#[0-9a-f]{6}$/i

/** The paint palette, plus a free colour picker for any other colour. */
function ColourChoice({
  label,
  colours,
  value,
  onChange,
}: {
  label: string
  colours: PriceBook["options"]["base"]
  value: string | undefined
  onChange: (value: string) => void
}) {
  const swatches = colours.map((colour) => (colour.swatch ?? colour.value).toLowerCase()).filter((hex) => HEX.test(hex))
  const custom = value && !swatches.includes(value.toLowerCase())
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {colours.map((colour) => {
          const hex = colour.swatch ?? colour.value
          return (
            <button
              key={colour.value}
              type="button"
              onClick={() => onChange(hex)}
              aria-label={colour.label}
              aria-pressed={value?.toLowerCase() === hex.toLowerCase()}
              className={cn("size-7 rounded-full ring-1 ring-carbon/20 transition", value?.toLowerCase() === hex.toLowerCase() && "ring-2 ring-brand-ink ring-offset-2")}
              style={{ backgroundColor: hex }}
            />
          )
        })}
        <label
          className={cn(
            "relative flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition focus-within:ring-3 focus-within:ring-ring/50",
            custom ? "border-brand-ink" : "border-carbon/15 hover:border-carbon/35",
          )}
        >
          <span
            className="size-4 rounded-full ring-1 ring-carbon/20"
            style={{ background: custom ? value : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
            aria-hidden
          />
          Any colour
          <input
            type="color"
            value={value && HEX.test(value) ? value : "#ffffff"}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label}: pick any colour`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </fieldset>
  )
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-semibold">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-brand-ink" />
    </label>
  )
}

function ToggleChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3.5 text-sm transition",
        pressed ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
      )}
    >
      {children}
    </button>
  )
}

const NUDGE = 0.05
const clampOffset = (value: number) => Math.max(-1, Math.min(1, Math.round(value * 100) / 100))

/**
 * Moves an item within its spot on the helmet: sliders for big moves, arrows to nudge.
 * Offsets run from -1 to 1 (left/up to right/down); 0 is the spot's centre.
 */
function FinePosition({ id, x, y, onChange }: { id: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
  const arrow = "grid size-8 place-items-center rounded-lg border border-carbon/15 text-carbon transition hover:border-carbon/40"
  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-sm font-semibold">Fine position</legend>
        {(x !== 0 || y !== 0) && (
          <button type="button" onClick={() => onChange(0, 0)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-carbon">
            <RotateCcw className="size-3.5" aria-hidden /> Centre
          </button>
        )}
      </div>
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label htmlFor={`${id}-x`} className="space-y-1.5 text-sm">
            <span className="font-medium">Left ↔ right</span>
            <input id={`${id}-x`} type="range" min={-1} max={1} step={0.05} value={x} onChange={(event) => onChange(Number(event.target.value), y)} className="w-full accent-brand-ink" />
          </label>
          <label htmlFor={`${id}-y`} className="space-y-1.5 text-sm">
            <span className="font-medium">Up ↕ down</span>
            <input id={`${id}-y`} type="range" min={-1} max={1} step={0.05} value={y} onChange={(event) => onChange(x, Number(event.target.value))} className="w-full accent-brand-ink" />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1 justify-self-start" role="group" aria-label="Nudge">
          <span />
          <button type="button" className={arrow} aria-label="Nudge up" onClick={() => onChange(x, clampOffset(y - NUDGE))}>
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <span />
          <button type="button" className={arrow} aria-label="Nudge left" onClick={() => onChange(clampOffset(x - NUDGE), y)}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="grid size-8 place-items-center text-[0.65rem] text-muted-foreground" aria-hidden>
            •
          </span>
          <button type="button" className={arrow} aria-label="Nudge right" onClick={() => onChange(clampOffset(x + NUDGE), y)}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <span />
          <button type="button" className={arrow} aria-label="Nudge down" onClick={() => onChange(x, clampOffset(y + NUDGE))}>
            <ChevronDown className="size-4" aria-hidden />
          </button>
          <span />
        </div>
      </div>
    </fieldset>
  )
}

/** The text as it will be lettered, in its font, style, colour and outline. */
function LetteringPreview({ item }: { item: PersonalItem }) {
  const font = helmetFont(item.font)
  const italic = item.italic ?? font.italic
  const weight = item.bold ? Math.max(700, font.weight) : font.weight
  const outline = item.outline && (item.outlineWidth ?? 0) > 0 ? `${Math.max(1, (item.outlineWidth ?? 0) * 40).toFixed(1)}px ${item.outline}` : undefined
  return (
    <div className="flex min-h-20 items-center justify-center overflow-hidden rounded-xl bg-[repeating-conic-gradient(#ececec_0_25%,#f7f7f7_0_50%)] bg-[length:16px_16px] px-4 py-3">
      <span
        className="max-w-full truncate text-4xl leading-tight"
        style={{
          fontFamily: font.family,
          fontWeight: weight,
          fontStyle: italic ? "italic" : "normal",
          letterSpacing: `${item.letterSpacing ?? 0}em`,
          color: item.colour ?? "#111412",
          WebkitTextStroke: outline,
          paintOrder: "stroke fill",
        }}
      >
        {item.value || "Preview"}
      </span>
    </div>
  )
}

/**
 * Step 10: sponsor and team logos. Uploads go to the customer's own private folder;
 * the workshop checks every file before it reaches production.
 */
export function StepLogos({
  config,
  update,
  returnTo,
  onLogoUrl,
}: UpdateProps & { returnTo: string; onLogoUrl: (path: string, url: string) => void }) {
  const logos = config.logos ?? []
  const setLogos = (next: LogoPlacementItem[]) => update({ v: "2", logos: next })

  return (
    <div className="space-y-5">
      <ul className="space-y-4">
        {logos.map((logo, index) => (
          <li key={logo.path} className="space-y-4 rounded-2xl border border-carbon/15 p-4">
            <div className="flex items-start justify-between gap-3">
              <LogoPreview path={logo.path} onUrl={onLogoUrl} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove logo ${index + 1}`}
                onClick={() => setLogos(logos.filter((_, position) => position !== index))}
              >
                <Trash2 />
              </Button>
            </div>
            <PlacementPicker
              label="Where it goes"
              options={logoPlacements}
              value={logo.position}
              onChange={(position) => setLogos(logos.map((item, p) => (p === index ? { ...item, position } : item)))}
            />
            <FinePosition
              id={`logo-${index}`}
              x={logo.offsetX ?? 0}
              y={logo.offsetY ?? 0}
              onChange={(offsetX, offsetY) => setLogos(logos.map((item, p) => (p === index ? { ...item, offsetX, offsetY } : item)))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-semibold">Size</span>
                <input
                  type="range"
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={logo.scale ?? 1}
                  onChange={(event) => setLogos(logos.map((item, p) => (p === index ? { ...item, scale: Number(event.target.value) } : item)))}
                  className="w-full accent-brand-ink"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-semibold">Angle</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={logo.rotation ?? 0}
                  onChange={(event) => setLogos(logos.map((item, p) => (p === index ? { ...item, rotation: Number(event.target.value) } : item)))}
                  className="w-full accent-brand-ink"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {logos.length < 4 ? (
        <LogoUpload
          onChange={(path) => setLogos([...logos, { path, position: "back", scale: 1, rotation: 0 }])}
          returnTo={returnTo}
        />
      ) : (
        <p className="text-sm text-muted-foreground">That&apos;s the maximum of four logos.</p>
      )}

      <p className="rounded-xl bg-paddock/50 p-3 text-xs text-muted-foreground">
        We check every logo before production and will come back to you if artwork can&apos;t be reproduced, or if it
        needs permission from the rights holder.
      </p>
    </div>
  )
}

/** Private bucket, so the thumbnail and the 3D preview both need a signed URL. */
function LogoPreview({ path, onUrl }: { path: string; onUrl: (path: string, url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    createClient()
      .storage.from("design-logos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (cancelled || !data?.signedUrl) return
        setUrl(data.signedUrl)
        onUrl(path, data.signedUrl)
      })
    return () => {
      cancelled = true
    }
  }, [path, onUrl])

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-paddock/60 ring-1 ring-carbon/10">
        {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL, not a catalogue image */}
        {url ? <img src={url} alt="Your logo" className="max-h-full max-w-full object-contain" /> : null}
      </span>
      <span className="min-w-0 text-sm text-muted-foreground">Uploaded</span>
    </span>
  )
}
