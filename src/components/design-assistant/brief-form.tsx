"use client"

import { useId, useState } from "react"
import { ImagePlus, Loader2, Wand2, X } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { DESIGN_PHOTO_ACCEPT, prepareDesignPhoto, validateDesignPhoto, type PreparedPhoto } from "@/lib/design-assistant/photo"
import { cn } from "@/lib/utils"

const ideas = ["Matte black with lime", "Chrome with red stripes", "Navy and white, carbon film", "My number is 29"]

interface BriefFormProps {
  onSubmit: (photo: PreparedPhoto | null, note: string) => void
  /** The AI is working: the button waits. */
  busy?: boolean
  /** "Design my helmet" first, "Update my design" once there's a result. */
  submitLabel?: string
}

/** The brief: a photo (their helmet or an inspiration) and/or a short description. Stays editable to try again. */
export function BriefForm({ onSubmit, busy = false, submitLabel = "Design my helmet" }: BriefFormProps) {
  const inputId = useId()
  const noteId = useId()
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [note, setNote] = useState("")
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    const problem = validateDesignPhoto(file)
    if (problem) {
      toast.error(problem)
      return
    }
    setReading(true)
    try {
      const prepared = await prepareDesignPhoto(file)
      setPhoto((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl)
        return prepared
      })
    } catch {
      toast.error("We couldn't read that photo. Please try a JPG or PNG.")
    } finally {
      setReading(false)
    }
  }

  function removePhoto() {
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhoto(null)
  }

  const trimmed = note.trim()
  const canSubmit = !reading && !busy && (photo !== null || trimmed.length >= 3) && note.length <= 500

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit(photo, trimmed)
      }}
      className="space-y-5"
    >
      <p className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-carbon font-display text-xs font-bold text-paper">1</span>
        <span className="font-display text-xl font-bold uppercase leading-tight">Show us a helmet you like</span>
      </p>
      {photo ? (
        <div className="relative overflow-hidden rounded-2xl border border-carbon/10 bg-[#f4f3ef]">
          {/* Shown whole (never cropped), so the customer sees exactly what the AI gets. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the picked photo */}
          <img src={photo.previewUrl} alt="Your photo" className="mx-auto block h-64 w-full object-contain sm:h-72" />
          <div className="flex items-center gap-2 border-t border-carbon/10 bg-card px-3 py-2">
            <span className="text-xs text-muted-foreground">Colours we found</span>
            <span className="flex gap-1.5">
              {photo.palette.map((hex) => (
                <span key={hex} className="size-5 rounded-full ring-1 ring-carbon/15" style={{ backgroundColor: hex }} title={hex} aria-hidden />
              ))}
            </span>
            <span className="sr-only">{photo.palette.join(", ")}</span>
          </div>
          <Button
            type="button"
            variant="inverse"
            size="icon-sm"
            onClick={removePhoto}
            className="absolute right-2 top-2 bg-carbon/60"
            aria-label="Remove photo"
          >
            <X />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void pick(event.dataTransfer.files[0])
          }}
          className={cn(
            // relative: keeps the hidden file input inside the box, so focusing it doesn't scroll the panel.
            "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50",
            dragging ? "border-brand-ink bg-accent" : "border-carbon/15 hover:border-carbon/35 hover:bg-carbon/[0.03]",
          )}
        >
          {reading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
          )}
          <span className="text-sm font-semibold">{reading ? "Reading your photo…" : "Add a photo"}</span>
          <span className="text-xs text-muted-foreground">Your helmet, or a design you love. JPG, PNG or WebP.</span>
          <input
            id={inputId}
            type="file"
            accept={DESIGN_PHOTO_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              void pick(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </label>
      )}

      <div className="space-y-2">
        <label htmlFor={noteId} className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-carbon font-display text-xs font-bold text-paper">2</span>
          <span className="font-display text-xl font-bold uppercase leading-tight">Describe your design</span>
          <span className="text-xs text-muted-foreground">(optional with a photo)</span>
        </label>
        <textarea
          id={noteId}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onPaste={(event) => {
            const pasted = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/"))
            if (pasted) {
              event.preventDefault()
              void pick(pasted)
            }
          }}
          maxLength={500}
          placeholder="Colours, finish, your race number…"
          className="field-sizing-content max-h-40 min-h-24 w-full resize-none rounded-2xl border border-input bg-paper px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {ideas.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setNote((current) => (current.trim() ? `${current.trim()}, ${idea.toLowerCase()}` : idea))}
              className="rounded-full border border-carbon/15 px-2.5 py-1 text-xs text-carbon/75 transition-colors hover:border-carbon/40 hover:text-carbon"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />} {busy ? "Designing…" : submitLabel}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Free, and you can change it as often as you like.</p>
    </form>
  )
}
