"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, LayoutTemplate, Loader2, Plus, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { LogoUpload } from "@/components/builder/logo-upload"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteKartDesign, generateKartDesign, submitKartStickerRequest } from "@/lib/actions/kart-stickers"
import { findKartLayout, isReadyLayout, kartFinishes, kartFinishLabels, kartLayouts, MAX_KART_LOGOS, readyKartLayouts } from "@/lib/kart-stickers/options"
import { cn } from "@/lib/utils"
import { kartDesignSchema, type KartDesignValues } from "@/lib/validations/kart-stickers"
import type { KartDesign } from "@/types/kart-stickers"

const RETURN_TO = "/kart-stickers"

const ideas = [
  "Black and fluoro yellow lightning bolts with a chequered flag fade",
  "Retro Gulf-style light blue and orange stripes",
  "Red and white tiger stripes with gold pinstripes",
  "Dark navy with neon pink geometric shards",
]

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-carbon font-display text-xs font-bold text-paper">{step}</span>
        <span className="font-display text-xl font-bold uppercase leading-tight">{title}</span>
      </legend>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  )
}

/**
 * The kart sticker designer: pick a blank layout, describe the design, add a number, name,
 * logos and finish, and the AI paints it. Every design is kept below; the customer sends
 * the one they like for a quote.
 */
export function KartStickerStudio({ initialDesigns, initialRemaining, limit }: { initialDesigns: KartDesign[]; initialRemaining: number; limit: number }) {
  const [designs, setDesigns] = useState(initialDesigns)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [latest, setLatest] = useState<string | null>(null)
  const [logoSlots, setLogoSlots] = useState(1)
  const [pending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<KartDesignValues>({
    resolver: zodResolver(kartDesignSchema),
    defaultValues: { layout: readyKartLayouts[0]?.id ?? "", kartModel: "", prompt: "", raceNumber: "", driverName: "", finish: "gloss", logos: [] },
  })
  const prompt = useWatch({ control, name: "prompt" })

  function design(values: KartDesignValues) {
    startTransition(async () => {
      const result = await generateKartDesign(values)
      if (!result.ok || !result.data) {
        toast.error(result.message)
        return
      }
      const created = result.data.design
      setDesigns((current) => [created, ...current])
      setRemaining(result.data.remaining)
      setLatest(created.id)
      toast.success("Your design is ready. Scroll down to see it.")
      document.getElementById("kart-designs")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  /** Puts a saved design's choices back in the form, to try a variation. */
  function reuse(item: KartDesign) {
    reset({ layout: item.layout, kartModel: item.kartModel, prompt: item.prompt, raceNumber: item.raceNumber, driverName: item.driverName, finish: item.finish, logos: item.logos })
    setLogoSlots(Math.max(1, item.logos.length))
    document.getElementById("kart-design-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-10">
      <form id="kart-design-form" onSubmit={handleSubmit(design)} noValidate className="scroll-mt-24 space-y-8 rounded-3xl border border-carbon/10 bg-card p-5 sm:p-8">
        <Section step={1} title="Choose your layout" description="The sticker panels for your kart's bodywork. The AI designs inside these exact shapes.">
          <Controller
            control={control}
            name="layout"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {kartLayouts.map((layout) => {
                  const ready = isReadyLayout(layout)
                  const selected = field.value === layout.id
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      // Layouts without a blank yet are listed so customers see what's coming.
                      disabled={!ready}
                      onClick={() => field.onChange(layout.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-2xl border text-left transition disabled:cursor-not-allowed",
                        selected ? "border-brand-ink ring-2 ring-brand-ink/25" : ready ? "border-carbon/15 hover:border-carbon/40" : "border-dashed border-carbon/15",
                      )}
                    >
                      {ready ? (
                        <Image src={layout.image} alt={`${layout.name} blank sticker layout`} width={layout.width} height={layout.height} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="aspect-square h-auto w-full bg-white object-cover" />
                      ) : (
                        <span className="grid aspect-square w-full place-items-center bg-paper/60 text-muted-foreground">
                          <LayoutTemplate className="size-7 opacity-40" aria-hidden />
                        </span>
                      )}
                      <span className="flex flex-1 items-start justify-between gap-2 p-2.5">
                        <span>
                          <span className={cn("block text-sm font-semibold", !ready && "text-muted-foreground")}>{layout.name}</span>
                          <span className="block text-xs text-muted-foreground">{ready ? "Ready to design" : "Layout coming soon"}</span>
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-brand-ink" aria-hidden />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Kart not listed? Pick the closest layout and tell us your exact kart below: we&apos;ll fit the design to it.
          </p>
        </Section>

        <Section step={2} title="Your kart">
          <FormField id="kart-model" label="Kart make and model" error={errors.kartModel?.message}>
            <Input {...register("kartModel")} {...fieldA11y("kart-model", errors.kartModel?.message)} placeholder="e.g. MS Kart Rookie, Kosmic Mercury R" maxLength={80} />
          </FormField>
        </Section>

        <Section step={3} title="Describe your design" description="Colours, style, patterns, anything you love. The more you say, the closer the AI gets.">
          <FormField id="kart-prompt" label="Design description" error={errors.prompt?.message}>
            <Textarea {...register("prompt")} {...fieldA11y("kart-prompt", errors.prompt?.message)} rows={4} maxLength={1000} placeholder="e.g. Matte black with fluoro green lightning bolts and a chequered flag fade on the side pods" />
          </FormField>
          {!prompt && (
            <div className="flex flex-wrap gap-2">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setValue("prompt", idea, { shouldValidate: true })}
                  className="rounded-full border border-carbon/15 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-carbon/40 hover:text-carbon"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section step={4} title="Number, name and logos" description="Optional. The AI places them on the panels of your kit.">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <FormField id="kart-number" label="Race number" optional error={errors.raceNumber?.message}>
              <Input {...register("raceNumber")} {...fieldA11y("kart-number", errors.raceNumber?.message)} maxLength={4} inputMode="numeric" placeholder="43" />
            </FormField>
            <FormField id="kart-name" label="Driver name" optional error={errors.driverName?.message}>
              <Input {...register("driverName")} {...fieldA11y("kart-name", errors.driverName?.message)} maxLength={40} placeholder="e.g. A. Taylor" />
            </FormField>
          </div>
          <Controller
            control={control}
            name="logos"
            render={({ field }) => (
              <div className="space-y-3">
                {Array.from({ length: Math.max(logoSlots, field.value.length) }, (_, index) => (
                  <LogoUpload
                    key={`${index}-${field.value[index] ?? ""}`}
                    path={field.value[index]}
                    returnTo={RETURN_TO}
                    onChange={(path) => {
                      const next = [...field.value]
                      if (path) next[index] = path
                      else next.splice(index, 1)
                      field.onChange(next.filter(Boolean))
                      if (!path) setLogoSlots((count) => Math.max(1, count - 1))
                    }}
                  />
                ))}
                {field.value.length >= logoSlots && logoSlots < MAX_KART_LOGOS && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setLogoSlots((count) => count + 1)}>
                    <Plus /> Add another logo
                  </Button>
                )}
                {errors.logos?.message && <p role="alert" className="text-xs font-medium text-destructive">{errors.logos.message}</p>}
              </div>
            )}
          />
        </Section>

        <Section step={5} title="Finish">
          <Controller
            control={control}
            name="finish"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kartFinishes.map((finish) => {
                  const selected = field.value === finish
                  return (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => field.onChange(finish)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors",
                        selected ? "border-carbon bg-carbon text-paper" : "border-carbon/15 hover:border-carbon/40",
                      )}
                    >
                      <span className="font-semibold">{kartFinishLabels[finish].label}</span>
                      <span className={cn("text-xs", selected ? "text-paper/70" : "text-muted-foreground")}>{kartFinishLabels[finish].hint}</span>
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Section>

        <div className="flex flex-col gap-3 border-t border-carbon/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {remaining > 0 ? `${remaining} of ${limit} designs left today.` : `You've used today's ${limit} designs. Come back tomorrow for more.`} Each design
            takes about half a minute.
          </p>
          <Button type="submit" size="lg" disabled={pending || remaining === 0}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? "Designing your stickers…" : "Design my stickers"}
          </Button>
        </div>
      </form>

      <section id="kart-designs" aria-labelledby="kart-designs-heading" className="scroll-mt-24 space-y-4">
        <h2 id="kart-designs-heading" className="font-display text-3xl font-bold uppercase">
          Your designs
        </h2>
        {designs.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-carbon/20 p-8 text-center text-sm text-muted-foreground">
            Your designs appear here. Make as many versions as you like, then send your favourite for a quote.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {designs.map((item) => (
              <DesignCard
                key={item.id}
                design={item}
                highlighted={item.id === latest}
                onReuse={() => reuse(item)}
                onDeleted={() => setDesigns((current) => current.filter((entry) => entry.id !== item.id))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DesignCard({ design, highlighted, onReuse, onDeleted }: { design: KartDesign; highlighted: boolean; onReuse: () => void; onDeleted: () => void }) {
  const layout = findKartLayout(design.layout)
  return (
    <li className={cn("overflow-hidden rounded-3xl border bg-card", highlighted ? "border-brand-ink ring-2 ring-brand-ink/25" : "border-carbon/10")}>
      {design.imageUrl ? (
        <a href={design.imageUrl} target="_blank" rel="noreferrer" className="block bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link to a private picture */}
          <img src={design.imageUrl} alt={`Kart sticker design: ${design.prompt}`} className="aspect-square w-full object-contain" />
        </a>
      ) : (
        <p className="grid aspect-square place-items-center bg-paper text-sm text-muted-foreground">Picture unavailable</p>
      )}
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-sm">{design.prompt}</p>
        <p className="text-xs text-muted-foreground">
          {[design.kartModel, layout?.name, kartFinishLabels[design.finish]?.label, design.raceNumber && `#${design.raceNumber}`, design.driverName].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-wrap gap-2">
          <SendForQuote designId={design.id} />
          <Button type="button" variant="outline" size="sm" onClick={onReuse}>
            <RotateCcw /> Try a variation
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" aria-label="Delete design">
                <Trash2 />
              </Button>
            }
            title="Delete this design?"
            description="It's removed from your designs. Designs you've already sent for a quote stay with your request."
            confirmLabel="Delete"
            onConfirm={async () => {
              const result = await deleteKartDesign(design.id)
              if (result.ok) onDeleted()
              return result
            }}
          />
        </div>
      </div>
    </li>
  )
}

/** Sends a design to the workshop, with an optional note, for a quote. */
function SendForQuote({ designId }: { designId: string }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Send /> Send for a quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="size-5 text-emerald-600" aria-hidden /> Sent
              </DialogTitle>
              <DialogDescription>Your reference is {sent}. We&apos;ll check the design and come back to you with a quote. You can see it under Quote requests in your account.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send this design for a quote</DialogTitle>
              <DialogDescription>We&apos;ll check it, tidy it up for print and send you a price. Nothing to pay now.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <label htmlFor={`notes-${designId}`} className="text-sm font-medium">
                Anything we should know? <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea id={`notes-${designId}`} rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Deadline, changes you'd like, quantity…" />
            </div>
            <DialogFooter>
              <Button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const result = await submitKartStickerRequest({ designId, notes })
                      if (!result.ok || !result.data) {
                        toast.error(result.message)
                        return
                      }
                      setSent(result.data.reference)
                    } catch {
                      toast.error("That didn't go through. Check your connection and try again.")
                    }
                  })
                }
              >
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                Send for a quote
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
