"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Trophy } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { enterCompetition } from "@/lib/actions/competition"
import { formatClosing } from "@/lib/competition/status"
import { createClient } from "@/lib/supabase/browser"
import type { BuilderCompetition } from "@/types/competition"
import type { ConfigSummaryLine, HelmetConfiguration } from "@/types/configurator"

interface EnterCompetitionButtonProps {
  competition: BuilderCompetition
  slug: string
  productName: string
  getConfig: () => HelmetConfiguration
  summary: ConfigSummaryLine[]
  /** Where a guest comes back to after logging in. */
  returnTo: string
  /** The builder's main action (competition mode), rather than a secondary button. */
  primary?: boolean
}

/** Enters this build in the open competition. Guests log in first; entering again replaces the entry. */
export function EnterCompetitionButton({ competition, slug, productName, getConfig, summary, returnTo, primary = false }: EnterCompetitionButtonProps) {
  const nameId = useId()
  const rulesId = useId()
  const marketingId = useId()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [designName, setDesignName] = useState(`My ${productName}`)
  const [agreed, setAgreed] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [done, setDone] = useState<{ reference: string; updated: boolean } | null>(null)
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
      <Button asChild variant={primary ? "default" : "outline"} size={primary ? "lg" : "default"}>
        <Link href={`/login?next=${encodeURIComponent(returnTo)}`}>
          <Trophy /> Log in to enter the competition
        </Link>
      </Button>
    )
  }

  function submit() {
    startTransition(async () => {
      const result = await enterCompetition({
        competitionId: competition.id,
        slug,
        designName,
        config: getConfig(),
        summary: summary.map(({ key, label, value }) => ({ key, label, value })),
        agreedRules: agreed,
        marketingOptIn: marketing,
      })
      if (!result.ok || !result.data) {
        toast.error(result.message)
        return
      }
      setDone(result.data)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setDone(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant={primary ? "default" : "outline"} size={primary ? "lg" : "default"} disabled={signedIn === null}>
          <Trophy /> Enter the competition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden /> {done.updated ? "Entry updated" : "You're in!"}
              </DialogTitle>
              <DialogDescription>
                Your entry is {done.reference}. You can change your design and enter again until entries close; your latest
                design is the one we judge.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button asChild variant="outline">
                <Link href="/account/competition">View my entry</Link>
              </Button>
              <Button onClick={() => setOpen(false)}>Keep designing</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{competition.title}</DialogTitle>
              <DialogDescription>
                Enter this design. One entry per person; entering again replaces your entry.
                {competition.closesAt ? ` Entries close ${formatClosing(competition.closesAt)}.` : ""}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (agreed && designName.trim()) submit()
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor={nameId} className="text-sm font-medium">
                  Name your design
                </label>
                <Input id={nameId} value={designName} maxLength={60} onChange={(event) => setDesignName(event.target.value)} />
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Checkbox id={rulesId} checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" />
                <label htmlFor={rulesId}>
                  I agree to the{" "}
                  <Link href="/competition#rules" target="_blank" className="font-medium underline underline-offset-2">
                    competition rules
                  </Link>
                  .
                </label>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Checkbox id={marketingId} checked={marketing} onCheckedChange={(value) => setMarketing(value === true)} className="mt-0.5" />
                <label htmlFor={marketingId} className="text-muted-foreground">
                  Send me news and offers from Lucas Racing (optional).
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!agreed || !designName.trim() || isPending}>
                  {isPending && <Loader2 className="animate-spin" aria-hidden />}
                  Enter my design
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
