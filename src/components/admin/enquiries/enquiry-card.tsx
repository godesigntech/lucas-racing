"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2, Mail, Phone, Reply, UserRound } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateEnquiry } from "@/lib/actions/admin/enquiries"
import { formatDateTime } from "@/lib/format"
import { toneClasses } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import { enquiryStatuses, type Enquiry, type EnquiryStatus } from "@/types/enquiry"

const statusMeta: Record<EnquiryStatus, { label: string; tone: keyof typeof toneClasses }> = {
  new: { label: "New", tone: "warning" },
  replied: { label: "Replied", tone: "info" },
  closed: { label: "Closed", tone: "neutral" },
}

interface EnquiryCardProps {
  enquiry: Enquiry
  topicLabel: string
  designName?: string
}

/** One contact form message: who sent it, what they asked, and quick follow-up controls. */
export function EnquiryCard({ enquiry, topicLabel, designName }: EnquiryCardProps) {
  const [status, setStatus] = useState(enquiry.status)
  const [notes, setNotes] = useState(enquiry.adminNotes)
  const [isPending, startTransition] = useTransition()
  const notesChanged = notes.trim() !== enquiry.adminNotes

  function save(next: { status: EnquiryStatus; adminNotes: string }) {
    startTransition(async () => {
      const result = await updateEnquiry(enquiry.id, next)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  const replyHref = `mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: your message to Lucas Racing (${topicLabel})`)}`

  return (
    <article className="rounded-2xl border border-carbon/10 bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{enquiry.name}</p>
          <p className="text-xs text-muted-foreground">
            {topicLabel}
            {designName && ` · ${designName}`} · {formatDateTime(enquiry.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset",
            toneClasses[statusMeta[status].tone],
          )}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {statusMeta[status].label}
        </span>
      </header>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{enquiry.message}</p>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li className="flex items-center gap-1.5">
          <Mail className="size-4 text-muted-foreground" aria-hidden />
          <a href={replyHref} className="break-all underline-offset-4 hover:underline">
            {enquiry.email}
          </a>
        </li>
        {enquiry.phone && (
          <li className="flex items-center gap-1.5">
            <Phone className="size-4 text-muted-foreground" aria-hidden />
            <a href={`tel:${enquiry.phone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
              {enquiry.phone}
            </a>
          </li>
        )}
        {enquiry.userId && (
          <li className="flex items-center gap-1.5">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            <Link href={`/admin/customers/${enquiry.userId}`} className="underline-offset-4 hover:underline">
              Customer profile
            </Link>
          </li>
        )}
      </ul>

      <div className="mt-5 grid gap-3 border-t border-carbon/10 pt-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <a href={replyHref}>
              <Reply /> Reply by email
            </a>
          </Button>
          <Select
            value={status}
            onValueChange={(next) => {
              setStatus(next as EnquiryStatus)
              save({ status: next as EnquiryStatus, adminNotes: notes.trim() })
            }}
          >
            <SelectTrigger className="h-9 w-32" aria-label="Status">
              <SelectValue>{statusMeta[status].label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {enquiryStatuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {statusMeta[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />}
        </div>
        <div className="flex gap-2">
          <label htmlFor={`notes-${enquiry.id}`} className="sr-only">
            Internal notes
          </label>
          <Textarea
            id={`notes-${enquiry.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={1}
            placeholder="Internal note (only staff see this)"
            className="min-h-9 py-2"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!notesChanged || isPending}
            onClick={() => save({ status, adminNotes: notes.trim() })}
          >
            Save
          </Button>
        </div>
      </div>
    </article>
  )
}
