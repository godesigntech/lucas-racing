"use client"

import { useRef, useState } from "react"
import { Camera, FileText, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "react-toastify"

import { AdminCard } from "@/components/admin/admin-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addOrderProof, deleteOrderProof } from "@/lib/actions/admin/proofs"
import { formatDateTime } from "@/lib/format"
import { uploadOrderProof } from "@/lib/proofs/upload"
import { cn } from "@/lib/utils"
import type { ProofWithUrl } from "@/lib/data/proofs"
import type { ProofKind, ProofStatus } from "@/types/production"

const statusMeta: Record<ProofStatus, { label: string; tone: string }> = {
  pending: { label: "Waiting on the customer", tone: "bg-amber-100 text-amber-900 ring-amber-300/60" },
  approved: { label: "Approved", tone: "bg-accent text-brand-ink ring-brand-ink/25" },
  changes_requested: { label: "Changes requested", tone: "bg-destructive/10 text-destructive ring-destructive/25" },
}

/**
 * Design proofs and finished-helmet photographs on one order.
 *
 * Sending a proof moves the order to "Proof sent" and emails the customer; nothing is
 * painted until they answer. Photographs are a record of the finished helmet.
 */
export function OrderProofs({ orderId, proofs }: { orderId: string; proofs: ProofWithUrl[] }) {
  const designProofs = proofs.filter((proof) => proof.kind === "design_proof")
  const photos = proofs.filter((proof) => proof.kind === "production_photo")

  return (
    <div className="space-y-6">
      <AdminCard
        title="Design proofs"
        description="What the customer signs off before anything is masked or painted. Links last an hour."
        action={<ProofUpload orderId={orderId} kind="design_proof" label="Send a proof" />}
      >
        {designProofs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No proof sent yet. Upload one and we&apos;ll email the customer to approve it.
          </p>
        ) : (
          <ul className="space-y-3">
            {designProofs.map((proof) => (
              <ProofRow key={proof.id} orderId={orderId} proof={proof} />
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard
        title="Finished helmet"
        description="Photographs of the completed helmet. The customer sees these on their order."
        action={<ProofUpload orderId={orderId} kind="production_photo" label="Add a photo" icon={Camera} />}
      >
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.id} className="group relative">
                {photo.url && (
                  <a href={photo.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-carbon/10 p-2 transition-colors hover:border-carbon/30">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL */}
                    <img src={photo.url} alt={photo.caption || "Finished helmet"} className="aspect-square w-full rounded-lg object-cover" />
                    {photo.caption && <span className="mt-2 block truncate text-xs text-muted-foreground">{photo.caption}</span>}
                  </a>
                )}
                <div className="absolute right-3 top-3">
                  <ConfirmDialog
                    title="Remove this photo?"
                    description="It disappears from the customer's order too."
                    confirmLabel="Remove"
                    onConfirm={async () => (await deleteOrderProof(orderId, photo.id)).ok}
                    trigger={
                      <Button type="button" variant="outline" size="icon" aria-label="Remove photo">
                        <Trash2 />
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  )
}

function ProofRow({ orderId, proof }: { orderId: string; proof: ProofWithUrl }) {
  const meta = statusMeta[proof.status]
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-carbon/10 p-3">
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-paddock/60">
        {proof.isPdf ? (
          <FileText className="size-6 text-muted-foreground" aria-hidden />
        ) : proof.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- private signed URL
          <img src={proof.url} alt="" className="size-full object-cover" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          Proof {proof.version}
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium ring-1", meta.tone)}>{meta.label}</span>
        </p>
        {proof.caption && <p className="mt-0.5 text-xs text-muted-foreground">{proof.caption}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">Sent {formatDateTime(proof.createdAt)}</p>
        {proof.customerNote && (
          <p className="mt-2 rounded-xl bg-paddock/50 p-2.5 text-xs">
            <span className="font-semibold">Customer:</span> {proof.customerNote}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {proof.url && (
          <Button asChild variant="ghost" size="sm">
            <a href={proof.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </Button>
        )}
        <ConfirmDialog
          title={`Remove proof ${proof.version}?`}
          description="The customer will no longer see it."
          confirmLabel="Remove"
          onConfirm={async () => (await deleteOrderProof(orderId, proof.id)).ok}
          trigger={
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove proof ${proof.version}`}>
              <Trash2 />
            </Button>
          }
        />
      </div>
    </li>
  )
}

function ProofUpload({
  orderId,
  kind,
  label,
  icon: Icon = Upload,
}: {
  orderId: string
  kind: ProofKind
  label: string
  icon?: typeof Upload
}) {
  const input = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState("")
  const [busy, setBusy] = useState(false)

  async function onPick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const imagePath = await uploadOrderProof(orderId, file)
      const result = await addOrderProof(orderId, { imagePath, kind, caption, orderItemId: null })
      if (result.ok) {
        toast.success(result.message)
        setCaption("")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That file couldn't be uploaded.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Caption (optional)"
        aria-label={`Caption for ${label.toLowerCase()}`}
        className="h-9 w-full sm:w-44"
      />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => onPick(event.target.files?.[0])}
      />
      <Button type="button" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Icon />}
        {label}
      </Button>
    </div>
  )
}
