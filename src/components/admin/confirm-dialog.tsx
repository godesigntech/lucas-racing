"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ActionResult } from "@/types/account"

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  /**
   * Runs the action. Return its ActionResult and the dialog shows the message and stays
   * open if it failed; return false to stay open without a message.
   */
  onConfirm: () => Promise<ActionResult | boolean | void>
}

/**
 * Asks before a destructive action; stays open with a spinner while it runs. If the action
 * fails, or throws (a lost connection), it says so and stays open to try again.
 */
export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await onConfirm()
                  if (typeof result === "object" && result !== null) {
                    if (result.ok) toast.success(result.message)
                    else toast.error(result.message)
                    if (result.ok) setOpen(false)
                    return
                  }
                  if (result !== false) setOpen(false)
                } catch {
                  toast.error("That didn't go through. Check your connection and try again.")
                }
              })
            }
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
