"use client"

import { useState, useTransition } from "react"
import { Crown, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { chooseCompetitionWinner, updateCompetitionEntry } from "@/lib/actions/admin/competition"
import { recordablePlaces } from "@/lib/competition/prizes"
import { entryStatusMeta } from "@/lib/competition/status"
import type { EntryStatus } from "@/types/competition"

const reviewStatuses = ["entered", "shortlisted", "disqualified"] as const
type ReviewStatus = (typeof reviewStatuses)[number]

const NO_PLACE = "none"
const ordinal = (place: number) => `${place}${place === 2 ? "nd" : place === 3 ? "rd" : "th"} place`

/** Shortlist or disqualify an entry, record its place in the vote, keep notes, and pick the winner. */
export function EntryReviewForm({
  id,
  status,
  adminNotes,
  entrantName,
  place: savedPlace,
}: {
  id: string
  status: EntryStatus
  adminNotes: string
  entrantName: string
  place: number | null
}) {
  const winner = status === "winner"
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(winner ? "shortlisted" : (status as ReviewStatus))
  const [notes, setNotes] = useState(adminNotes)
  const [place, setPlace] = useState<number | null>(savedPlace)
  const [isPending, startTransition] = useTransition()

  // Status and place save as soon as they're picked; notes save with the button.
  function save(changes: { status?: ReviewStatus; place?: number | null } = {}) {
    const next = { status: changes.status ?? reviewStatus, place: changes.place !== undefined ? changes.place : place }
    const before = { status: reviewStatus, place }
    setReviewStatus(next.status)
    setPlace(next.place)
    startTransition(async () => {
      const result = await updateCompetitionEntry(id, { status: next.status, adminNotes: notes, place: next.place })
      if (result.ok) {
        toast.success(result.message)
      } else {
        // Put the menus back to what's saved.
        setReviewStatus(before.status)
        setPlace(before.place)
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-5">
      {winner ? (
        <p className="flex items-center gap-2 rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          <Crown className="size-4 text-brand-ink" aria-hidden /> This entry is the winner.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="entry-status" className="text-sm font-medium">
              Status
            </label>
            <Select value={reviewStatus} onValueChange={(value) => save({ status: value as ReviewStatus })} disabled={isPending}>
              <SelectTrigger id="entry-status" className="w-full">
                <SelectValue>{entryStatusMeta[reviewStatus].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {reviewStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {entryStatusMeta[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Saved as soon as you pick it. The shortlist is private: entrants only see whether they won.</p>
          </div>
          {reviewStatus !== "disqualified" && (
            <div className="space-y-1.5">
              <label htmlFor="entry-place" className="text-sm font-medium">
                Place in the vote
              </label>
              <Select value={place ? String(place) : NO_PLACE} onValueChange={(value) => save({ place: value === NO_PLACE ? null : Number(value) })} disabled={isPending}>
                <SelectTrigger id="entry-place" className="w-full">
                  <SelectValue>{place ? ordinal(place) : "6th or lower"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PLACE}>6th or lower</SelectItem>
                  {recordablePlaces.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {ordinal(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Sets their voucher: 2nd 50%, 3rd 40%, 4th 30%, 5th 20%, everyone else 10%. Choose the winner below.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="entry-notes" className="text-sm font-medium">
              Internal notes
            </label>
            <Textarea id="entry-notes" rows={4} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Judges' comments… Only admins see this." />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            Save notes
          </Button>
        </form>
      )}

      {!winner && status !== "disqualified" && (
        <ConfirmDialog
          trigger={
            <Button className="w-full">
              <Crown /> Choose as winner
            </Button>
          }
          title="Choose this entry as the winner?"
          description={`${entrantName} is emailed straight away, the competition is marked as judged and the winner is shown on the competition page. Any earlier winner goes back to the shortlist.`}
          confirmLabel="Choose winner"
          onConfirm={async () => {
            const result = await chooseCompetitionWinner(id)
            if (result.ok) toast.success(result.message)
            else toast.error(result.message)
            return result.ok
          }}
        />
      )}
    </div>
  )
}
