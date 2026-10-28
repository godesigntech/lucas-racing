"use client"

import { useState } from "react"
import { Check, FileText, Loader2, PencilLine } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { respondToProof } from "@/lib/actions/proofs"
import { formatDateTime } from "@/lib/format"
import type { ProofWithUrl } from "@/lib/data/proofs"

/**
 * The customer's proof: look at it, then approve it or ask for changes.
 *
 * This is the gate before any painting starts, so it's deliberately the most prominent
 * thing on the order page while an answer is outstanding.
 */
export function ProofApproval({ proof }: { proof: ProofWithUrl }) {
  const [mode, setMode] = useState<"idle" | "changes">("idle")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function answer(approved: boolean) {
    setBusy(true)
    const result = await respondToProof({ proofId: proof.id, approved, note })
    setBusy(false)
    if (result.ok) {
      toast.success(result.message)
      setMode("idle")
      setNote("")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <section
      aria-labelledby="proof-heading"
      className="overflow-hidden rounded-[1.75rem] border border-brand-ink/20 bg-accent/40"
    >
      <div className="border-b border-brand-ink/10 px-5 py-4 sm:px-6">
        <h2 id="proof-heading" className="font-display text-xl font-bold uppercase">
          Your proof is ready
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sent {formatDateTime(proof.createdAt)}. Nothing is masked, painted or dipped until you approve it, and
          changes at this stage are free.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {proof.url ? (
            proof.isPdf ? (
              <a
                href={proof.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-carbon/15 bg-card p-4 text-sm font-medium hover:border-carbon/35"
              >
                <FileText className="size-5 text-brand-ink" aria-hidden />
                Open your proof (PDF)
              </a>
            ) : (
              <a href={proof.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                <img
                  src={proof.url}
                  alt="Your helmet proof"
                  className="w-full rounded-2xl border border-carbon/10 bg-card object-contain"
                />
              </a>
            )
          ) : (
            <p className="rounded-2xl border border-carbon/15 bg-card p-4 text-sm text-muted-foreground">
              We couldn&apos;t load the image. Please reload the page.
            </p>
          )}
          {proof.caption && <p className="mt-2 text-sm text-muted-foreground">{proof.caption}</p>}
        </div>

        <div className="space-y-3">
          {mode === "idle" ? (
            <>
              <Button size="lg" className="w-full" disabled={busy} onClick={() => answer(true)}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Check />}
                Approve this proof
              </Button>
              <Button variant="outline" size="lg" className="w-full" disabled={busy} onClick={() => setMode("changes")}>
                <PencilLine /> Ask for changes
              </Button>
              <p className="text-xs text-muted-foreground">
                Once you approve, we book your helmet in and send a payment link.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="proof-note" className="block text-sm font-semibold">
                What would you like changed?
              </label>
              <textarea
                id="proof-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="e.g. Make the red stripe wider, and move my number to the back."
                className="w-full rounded-xl border border-carbon/15 bg-card p-3 text-sm"
              />
              <Button size="lg" className="w-full" disabled={busy || !note.trim()} onClick={() => answer(false)}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <PencilLine />}
                Send these changes
              </Button>
              <Button variant="ghost" className="w-full" disabled={busy} onClick={() => setMode("idle")}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/** Photographs of the finished helmet, once the workshop has added them. */
export function FinishedPhotos({ photos }: { photos: ProofWithUrl[] }) {
  if (photos.length === 0) return null
  return (
    <section aria-labelledby="photos-heading" className="rounded-[1.75rem] border border-carbon/10 bg-card p-5 sm:p-6">
      <h2 id="photos-heading" className="font-display text-xl font-bold uppercase">
        Your finished helmet
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {photos.map((photo) =>
          photo.url ? (
            <li key={photo.id}>
              <a href={photo.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Your finished helmet"}
                  className="aspect-square w-full rounded-xl border border-carbon/10 object-cover"
                />
                {photo.caption && <span className="mt-1.5 block text-xs text-muted-foreground">{photo.caption}</span>}
              </a>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  )
}
