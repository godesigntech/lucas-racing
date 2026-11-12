"use client"

import { Loader2, Ticket, Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "react-toastify"

import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteCompetitionEntries, issueCompetitionVouchers } from "@/lib/actions/admin/competition"

/** Issues (and emails) every eligible entrant's voucher. Safe to press again after changes. */
export function IssueVouchersButton({ competitionId, disabled }: { competitionId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const result = await issueCompetitionVouchers(competitionId)
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Ticket aria-hidden />} Issue vouchers
    </Button>
  )
}

/** Deletes every entry record once prizes and vouchers are out, as the rules promise. */
export function DeleteEntriesButton({ competitionId, disabled }: { competitionId: string; disabled?: boolean }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="text-destructive" disabled={disabled}>
          <Trash2 aria-hidden /> Delete entry records
        </Button>
      }
      title="Delete every entry record?"
      description="This permanently deletes all entries, their designs and pictures, and can't be undone. Vouchers already issued and the winner's announcement are kept. Only do this once the prizes and vouchers are out."
      confirmLabel="Delete entries"
      onConfirm={async () => {
        const result = await deleteCompetitionEntries(competitionId)
        if (result.ok) toast.success(result.message)
        else toast.error(result.message)
        return result.ok
      }}
    />
  )
}
