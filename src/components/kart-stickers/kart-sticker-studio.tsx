"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Download, Flag, Flame, Layers, LayoutTemplate, Loader2, Plus, RotateCcw, Send, Sparkles, Trash2, Zap } from "lucide-react"
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

import { KartStickerStage } from "./kart-sticker-stage"
import { KartStickerSteps } from "./kart-sticker-steps"

const RETURN_TO = "/kart-stickers"

const ideas = [
  { icon: Zap, label: "Black & fluoro lightning", prompt: "Black and fluoro yellow lightning bolts with a chequered flag fade" },
  { icon: Flag, label: "Retro racing stripes", prompt: "Retro Gulf-style light blue and orange stripes" },
  { icon: Flame, label: "Tiger stripes & gold", prompt: "Red and white tiger stripes with gold pinstripes" },
  { icon: Sparkles, label: "Navy with neon shards", prompt: "Dark navy with neon pink geometric shards" },
]

/** A small picture of each vinyl finish for its tile. */
const finishSwatches: Record<string, string> = {
  gloss: "bg-[radial-gradient(circle_at_30%_25%,#ffffff_0,#3a3f3c_28%,#111412_70%)]",
  matt: "bg-[#2b2f2d]",
  holographic: "bg-[linear-gradient(135deg,#ff9ad5,#9be7ff_35%,#c6f432_60%,#ffd000_80%,#b38bff)]",
  chrome: "bg-[linear-gradient(160deg,#ffffff,#a9aeb3_35%,#f4f5f6_55%,#6b7075_80%,#d9dcdf)]",
}

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-carbon/10 pt-5 first:border-t-0 first:pt-0">
      <legend className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-carbon font-display text-xs font-bold text-paper">{step}</span>
        <span>
          <span className="block font-display text-xl font-bold uppercase leading-tight">{title}</span>
          {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
        </span>
      </legend>
      {children}
    </fieldset>
  )
}

/**
 * The kart sticker designer, laid out like the helmet builder: the picture on the left
 * (the blank layout, then the AI's designs, with every saved design underneath) and the
 * steps in a card on the right: layout, kart, description, number/name/logos, finish.
 */
export function KartStickerStudio({ initialDesigns, initialRemaining, limit }: { initialDesigns: KartDesign[]; initialRemaining: number; limit: number }) {
  const [designs, setDesigns] = useState(initialDesigns)
  const [remaining, setRemaining] = useState(initialRemaining)
  /** The design shown in the big picture; null shows the chosen blank layout. */
  const [shownId, setShownId] = useState<string | null>(initialDesigns[0]?.id ?? null)
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
  const layoutId = useWatch({ control, name: "layout" })
  const layout = findKartLayout(layoutId)
  const shown = designs.find((item) => item.id === shownId) ?? null
  // Progress: describe once a layout is picked, review once there's a design to look at.
  const currentStep = shown ? 4 : designs.length > 0 || pending ? 3 : prompt?.trim() ? 2 : 1

  /** Bring the results into view (they may be off screen, above or below the form). */
  function showStage() {
    document.getElementById("kart-stage")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
      setShownId(created.id)
      toast.success("Your design is ready.")
      showStage()
    })
  }

  /** Puts a saved design's choices back in the form, to try a variation. */
  function reuse(item: KartDesign) {
    reset({ layout: item.layout, kartModel: item.kartModel, prompt: item.prompt, raceNumber: item.raceNumber, driverName: item.driverName, finish: item.finish, logos: item.logos })
    setLogoSlots(Math.max(1, item.logos.length))
    toast.info("Its choices are back in the form. Change what you like and design again.")
    document.getElementById("kart-design-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function removed(id: string) {
    setDesigns((current) => current.filter((entry) => entry.id !== id))
    if (shownId === id) setShownId(null)
  }

  return (
    <div className="space-y-5">
    <KartStickerSteps current={currentStep} />
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
      {/* data-helmet-builder hides the floating chat buttons on phones (globals.css): they would cover the button. */}
      <form
        id="kart-design-form"
        data-helmet-builder
        onSubmit={handleSubmit(design)}
        noValidate
        aria-label="Design your kart stickers"
        className="flex min-w-0 scroll-mt-24 flex-col rounded-[1.75rem] border border-carbon/10 bg-card"
      >
        <header className="flex items-start justify-between gap-3 border-b border-carbon/10 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-brand-ink">
              <Layers className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold uppercase leading-none sm:text-3xl">Build your design</h2>
              <p className="mt-1 text-sm text-muted-foreground">Follow the steps to create your kart stickers.</p>
            </div>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-2xl font-bold leading-none sm:text-3xl" aria-live="polite">
              {remaining}/{limit}
            </span>
            <span className="text-xs text-muted-foreground">Designs left today</span>
          </p>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6">
        <Section step={1} title="Choose your layout" description={`The sticker panels for your kart's bodywork. Scroll to see all ${kartLayouts.length}.`}>
          <Controller
            control={control}
            name="layout"
            render={({ field }) => (
              <div className="grid max-h-[24rem] grid-cols-3 gap-2 overflow-y-auto overscroll-contain rounded-2xl border border-carbon/10 bg-carbon/[0.03] p-2">
                {kartLayouts.map((layout) => {
                  const ready = isReadyLayout(layout)
                  const selected = field.value === layout.id
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      // Layouts without a blank yet are listed so customers see what's coming.
                      disabled={!ready}
                      onClick={() => {
                        field.onChange(layout.id)
                        setShownId(null)
                      }}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-xl border bg-card text-left transition disabled:cursor-not-allowed",
                        selected ? "border-brand-ink ring-2 ring-brand-ink/25" : ready ? "border-carbon/15 hover:border-carbon/40" : "border-dashed border-carbon/15",
                      )}
                    >
                      {ready ? (
                        <Image src={layout.image} alt={`${layout.name} blank sticker layout`} width={layout.width} height={layout.height} sizes="(min-width: 1024px) 10vw, 30vw" className="aspect-square h-auto w-full bg-white object-cover" />
                      ) : (
                        <span className="grid aspect-square w-full place-items-center bg-paper/60 text-muted-foreground">
                          <LayoutTemplate className="size-7 opacity-40" aria-hidden />
                        </span>
                      )}
                      <span className="flex flex-1 items-center justify-between gap-1 px-2 py-1.5">
                        <span className={cn("truncate text-xs font-semibold", !ready && "text-muted-foreground")}>{ready ? layout.name : `${layout.name} (soon)`}</span>
                        {selected && <Check className="size-3.5 shrink-0 text-brand-ink" aria-hidden />}
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

        <Section step={2} title="Your kart" description="Tell us the make and model of your kart.">
          <FormField id="kart-model" label="Kart make and model" error={errors.kartModel?.message}>
            <Input {...register("kartModel")} {...fieldA11y("kart-model", errors.kartModel?.message)} placeholder="e.g. MS Kart Rookie, Kosmic Mercury R" maxLength={80} />
          </FormField>
        </Section>

        <Section step={3} title="Describe your design" description="Colours, style and any ideas you have. The more detail, the better the AI gets.">
          <FormField id="kart-prompt" label="Design description" error={errors.prompt?.message}>
            <Textarea {...register("prompt")} {...fieldA11y("kart-prompt", errors.prompt?.message)} rows={4} maxLength={1000} placeholder="e.g. Matte black with fluoro green lightning bolts and a chequered flag fade on the side pods" />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            {ideas.map(({ icon: Icon, label, prompt: idea }) => (
              <button
                key={label}
                type="button"
                title={idea}
                onClick={() => setValue("prompt", idea, { shouldValidate: true })}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-medium transition",
                  prompt === idea ? "border-brand-ink bg-accent text-carbon" : "border-carbon/15 text-carbon/80 hover:border-carbon/40 hover:text-carbon",
                )}
              >
                <Icon className="size-3.5 shrink-0 text-brand-ink" aria-hidden />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section step={4} title="Number, name and logos" description="Optional. Your race number, driver name and any sponsor logos.">
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

        <Section step={5} title="Finish" description="Choose the vinyl finish for your stickers.">
          <Controller
            control={control}
            name="finish"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {kartFinishes.map((finish) => {
                  const selected = field.value === finish
                  return (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => field.onChange(finish)}
                      aria-pressed={selected}
                      className={cn(
                        "relative flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                        selected ? "border-carbon bg-carbon text-paper" : "border-carbon/15 hover:border-carbon/40",
                      )}
                    >
                      <span aria-hidden className={cn("size-10 shrink-0 rounded-xl ring-1 ring-black/10", finishSwatches[finish])} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">{kartFinishLabels[finish].label}</span>
                        <span className={cn("block text-xs leading-snug", selected ? "text-paper/70" : "text-muted-foreground")}>{kartFinishLabels[finish].hint}</span>
                      </span>
                      {selected && (
                        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-carbon">
                          <Check className="size-3" aria-hidden />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Section>
        </div>

        <footer className="sticky bottom-0 z-10 flex flex-col gap-2 rounded-b-[1.75rem] border-t border-carbon/10 bg-card px-4 py-3 shadow-[0_-8px_20px_-14px_rgb(0_0_0/0.25)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            {remaining > 0 ? "About half a minute per design. Try as many versions as you like." : `You've used today's ${limit} designs. Come back tomorrow for more.`}
          </p>
          <Button type="submit" size="lg" className="shrink-0" disabled={pending || remaining === 0}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? "Designing…" : "Design my stickers"}
          </Button>
        </footer>
      </form>

      {/* Results: the chosen layout, then each AI design. */}
      <div id="kart-stage" className="scroll-mt-24">
        <KartStickerStage
          layout={layout}
          design={shown}
          designs={designs}
          pending={pending}
          onShow={setShownId}
          actions={
            shown && (
              <>
                <SendForQuote designId={shown.id} />
                <Button type="button" variant="outline" onClick={() => reuse(shown)}>
                  <RotateCcw /> Try another version
                </Button>
                {shown.imageUrl && (
                  <Button asChild variant="outline" size="icon" aria-label="Save the design">
                    <a href={shown.imageUrl} target="_blank" rel="noreferrer" download>
                      <Download />
                    </a>
                  </Button>
                )}
                <DeleteDesign id={shown.id} onDeleted={() => removed(shown.id)} />
              </>
            )
          }
        />
      </div>
    </div>
    </div>
  )
}

/** Deletes a saved design, after asking. */
function DeleteDesign({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" aria-label="Delete design">
          <Trash2 />
        </Button>
      }
      title="Delete this design?"
      description="It's removed from your designs. Designs you've already sent for a quote stay with your request."
      confirmLabel="Delete"
      onConfirm={async () => {
        const result = await deleteKartDesign(id)
        if (result.ok) onDeleted()
        return result
      }}
    />
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
        <Button type="button">
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
