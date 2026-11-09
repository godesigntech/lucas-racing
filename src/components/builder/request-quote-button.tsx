"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { submitBuildQuote } from "@/lib/actions/build-quote"
import { createClient } from "@/lib/supabase/browser"
import type { ConfigSummaryLine, HelmetConfiguration } from "@/types/configurator"

interface RequestQuoteButtonProps {
  slug: string
  name: string
  /** The build exactly as it would go in the basket. */
  getConfig: () => HelmetConfiguration
  summary: ConfigSummaryLine[]
  /** Where a guest comes back to after logging in. */
  returnTo: string
}

/** Sends a bespoke build to the workshop to be priced. Guests log in first. */
export function RequestQuoteButton({ slug, name, getConfig, summary, returnTo }: RequestQuoteButtonProps) {
  const notesId = useId()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getSession()
      .then(({ data }) => !cancelled && setSignedIn(Boolean(data.session)))
    return () => {
      cancelled = true
    }
  }, [])

  if (signedIn === false) {
    return (
      <Button asChild size="lg">
        <Link href={`/login?next=${encodeURIComponent(returnTo)}`}>
          <Send /> Log in to get a quote
        </Link>
      </Button>
    )
  }

  function send() {
    startTransition(async () => {
      const result = await submitBuildQuote({
        slug,
        name,
        config: getConfig(),
        summary: summary.map(({ key, label, value }) => ({ key, label, value })),
        notes,
      })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setSent(result.data?.reference ?? "")
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSent(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" disabled={signedIn === null}>
          <Send /> Get a quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {sent !== null ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden /> Design sent
              </DialogTitle>
              <DialogDescription>
                Your reference is {sent}. We&apos;ll price your helmet and email you. You can also check it in your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button asChild variant="outline">
                <Link href="/account/quotes">View my quotes</Link>
              </Button>
              <Button onClick={() => setOpen(false)}>Keep designing</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Get a quote for this design</DialogTitle>
              <DialogDescription>
                We&apos;ll look at your design, price it and email you. To start, you pay a 20% deposit (plus £200 with a
                chrome base coat).
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                send()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor={notesId} className="text-sm font-medium">
                  Anything we should know? <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Textarea id={notesId} rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Deadline, race date, ideas for the image…" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" aria-hidden />}
                  Send my design
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
