"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { CheckCircle2, Download, Loader2, Palette, Trophy } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { enterCompetition } from "@/lib/actions/competition"
import { formatClosing } from "@/lib/competition/status"
import { uploadDesignPhoto } from "@/lib/design-assistant/photo"
import { captureHelmetViews } from "@/lib/helmet-3d/capture"
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
  /** Entries need at least one hydrographic film (enter_competition() checks it too). */
  hasFilm: boolean
  /** Takes the customer to the step where films are added. */
  onAddFilm: () => void
  /** The 3D preview, photographed for the picture they share and for the vote. */
  getPreview: () => Element | null
}

const POST_URL = /^https?:\/\/\S+$/

/**
 * Enters this build in the open competition. Guests log in first; entering again replaces
 * the entry. Entrants share a picture of their design on social media (tagging Lucas Racing
 * and HydroKarts) and give us the post's link; the same picture goes in the anonymous vote.
 */
export function EnterCompetitionButton({ competition, slug, productName, getConfig, summary, returnTo, primary = false, hasFilm, onAddFilm, getPreview }: EnterCompetitionButtonProps) {
  const nameId = useId()
  const postId = useId()
  const ukId = useId()
  const rulesId = useId()
  const marketingId = useId()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [designName, setDesignName] = useState(`My ${productName}`)
  const [postUrl, setPostUrl] = useState("")
  const [ukResident, setUkResident] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [picture, setPicture] = useState<{ blob: Blob; url: string } | null>(null)
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

  // The picture's local link is freed when it's replaced or the dialog goes away.
  useEffect(() => () => {
    if (picture) URL.revokeObjectURL(picture.url)
  }, [picture])

  if (signedIn === false) {
    return (
      <Button asChild variant={primary ? "default" : "outline"} size={primary ? "lg" : "default"}>
        <Link href={`/login?next=${encodeURIComponent(returnTo)}`}>
          <Trophy /> Log in to enter the competition
        </Link>
      </Button>
    )
  }

  async function takePicture() {
    const [blob] = await captureHelmetViews(getPreview(), ["angle"]).catch(() => [])
    setPicture(blob ? { blob, url: URL.createObjectURL(blob) } : null)
  }

  const postValid = POST_URL.test(postUrl.trim())
  const ready = hasFilm && agreed && ukResident && postValid && designName.trim().length > 0

  function submit() {
    startTransition(async () => {
      let imagePath: string | undefined
      if (picture) {
        try {
          imagePath = await uploadDesignPhoto(picture.blob)
        } catch {
          toast.error("We couldn't save the picture of your design. Please try again.")
          return
        }
      }
      const result = await enterCompetition({
        competitionId: competition.id,
        slug,
        designName,
        config: getConfig(),
        summary: summary.map(({ key, label, value }) => ({ key, label, value })),
        agreedRules: agreed,
        marketingOptIn: marketing,
        ukResident,
        postUrl: postUrl.trim(),
        imagePath,
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
        if (next) void takePicture()
        if (!next) setDone(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant={primary ? "default" : "outline"} size={primary ? "lg" : "default"} disabled={signedIn === null}>
          <Trophy /> Enter the competition
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden /> {done.updated ? "Entry updated" : "You're in!"}
              </DialogTitle>
              <DialogDescription>
                Your entry is {done.reference}. You can change your design and enter again until
                entries close; your latest design is the one in the vote.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button asChild variant="outline">
                <Link href="/account/competition">View my entry</Link>
              </Button>
              <Button onClick={() => setOpen(false)}>Keep designing</Button>
            </DialogFooter>
          </>
        ) : !hasFilm ? (
          <>
            <DialogHeader>
              <DialogTitle>Add a hydrographic film first</DialogTitle>
              <DialogDescription>
                Competition designs need at least one hydrographic film. Pick a part of your helmet in Colours &amp; films and choose Film.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false)
                  onAddFilm()
                }}
              >
                <Palette /> Go to Colours &amp; films
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{competition.title}</DialogTitle>
              <DialogDescription>
                One entry per person; entering again replaces your entry.
                {competition.closesAt ? ` Entries close ${formatClosing(competition.closesAt)}.` : ""}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (ready) submit()
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor={nameId} className="text-sm font-medium">
                  Name your design
                </label>
                <Input id={nameId} value={designName} maxLength={60} onChange={(event) => setDesignName(event.target.value)} />
              </div>

              <div className="space-y-2 rounded-2xl border border-carbon/10 p-3">
                <p className="text-sm font-semibold">1. Share your design</p>
                <p className="text-xs text-muted-foreground">
                  Share your helmet on your story, and tag two people plus us, @hydro.karts.
                </p>
                <div className="flex items-center gap-3">
                  <span className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] ring-1 ring-carbon/10">
                    {picture ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a local picture of their design
                      <img src={picture.url} alt="Your helmet design" className="size-full object-contain" />
                    ) : (
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  {picture && (
                    <Button asChild variant="outline" size="sm">
                      <a href={picture.url} download={`${designName.trim() || "my-helmet"}.jpg`}>
                        <Download /> Download picture
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={postId} className="text-sm font-semibold">
                  2. Link to your story
                </label>
                <Input
                  id={postId}
                  type="url"
                  inputMode="url"
                  placeholder="https://www.instagram.com/stories/…"
                  value={postUrl}
                  maxLength={500}
                  onChange={(event) => setPostUrl(event.target.value)}
                  aria-invalid={postUrl.length > 0 && !postValid}
                />
                <p className="text-xs text-muted-foreground">Copy the link to your story on Instagram or Facebook.</p>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Checkbox id={ukId} checked={ukResident} onCheckedChange={(value) => setUkResident(value === true)} className="mt-0.5" />
                <label htmlFor={ukId}>I live in the UK and I&apos;m entering under my own name, with my own account.</label>
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
                <Button type="submit" disabled={!ready || isPending}>
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
