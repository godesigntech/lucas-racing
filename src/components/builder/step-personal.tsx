"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { logoPlacements, namePlacements, numberPlacements } from "@/lib/configurator/helmet-configuration"
import { formatOptionPrice } from "@/lib/format"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import { helmetFonts, type HelmetConfiguration, type LogoPlacementItem, type PersonalItem, type PersonalKind } from "@/types/configurator"

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

                {item.kind !== "flag" && (
                  <>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-semibold">Lettering</legend>
                      <div className="flex flex-wrap gap-2">
                        {helmetFonts.map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => patch(index, { font })}
                            aria-pressed={item.font === font}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm capitalize transition",
                              item.font === font ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
                            )}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="font-semibold">Size</span>
                        <input
                          type="range"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={item.scale ?? 1}
                          onChange={(event) => patch(index, { scale: Number(event.target.value) })}
                          className="w-full accent-brand-ink"
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-semibold">Angle</span>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          step={1}
                          value={item.rotation ?? 0}
                          onChange={(event) => patch(index, { rotation: Number(event.target.value) })}
                          className="w-full accent-brand-ink"
                        />
                      </label>
                    </div>

                    <div className="max-w-xs">
                      <PersonalColour colours={colours} value={item.colour} onChange={(colour) => patch(index, { colour })} />
                    </div>
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

function PersonalColour({
  colours,
  value,
  onChange,
}: {
  colours: PriceBook["options"]["base"]
  value: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">Colour</legend>
      <div className="flex flex-wrap gap-1.5">
        {colours.map((colour) => (
          <button
            key={colour.value}
            type="button"
            onClick={() => onChange(colour.swatch ?? colour.value)}
            aria-label={colour.label}
            aria-pressed={value === (colour.swatch ?? colour.value)}
            className={cn(
              "size-7 rounded-full ring-1 ring-carbon/20 transition",
              value === (colour.swatch ?? colour.value) && "ring-2 ring-brand-ink ring-offset-2",
            )}
            style={{ backgroundColor: colour.swatch ?? colour.value }}
          />
        ))}
      </div>
    </fieldset>
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
