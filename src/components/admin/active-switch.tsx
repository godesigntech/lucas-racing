"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "react-toastify"

import { Switch } from "@/components/ui/switch"
import type { ActionResult } from "@/types/account"

interface ActiveSwitchProps {
  checked: boolean
  label: string
  onToggle: (next: boolean) => Promise<ActionResult>
}

/** Instant on/off toggle that rolls back if the save fails. */
export function ActiveSwitch({ checked, label, onToggle }: ActiveSwitchProps) {
  const [optimistic, setOptimistic] = useOptimistic(checked)
  const [pending, startTransition] = useTransition()

  return (
    <Switch
      checked={optimistic}
      disabled={pending}
      aria-label={label}
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimistic(next)
          const result = await onToggle(next)
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
        })
      }
    />
  )
}
