"use client"

import { useId, useState, useTransition } from "react"
import { Loader2, Ticket, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkVoucher } from "@/lib/actions/checkout"

export interface AppliedVoucher {
  code: string
  percentOff: number
}

/** A competition voucher code at checkout. The order applies it again when it's placed. */
export function VoucherField({
  voucher,
  onChange,
  hasHelmets,
}: {
  voucher: AppliedVoucher | null
  onChange: (voucher: AppliedVoucher | null) => void
  hasHelmets: boolean
}) {
  const inputId = useId()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  if (voucher) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Ticket className="size-4" aria-hidden />
          {voucher.code}: {voucher.percentOff}% off your helmet finish
        </span>
        <button type="button" onClick={() => onChange(null)} className="grid size-7 place-items-center rounded-full hover:bg-white/10" aria-label="Remove voucher">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    )
  }

  function apply() {
    setError("")
    startTransition(async () => {
      const result = await checkVoucher(code)
      if (!result.ok || !result.data) {
        setError(result.message ?? "That voucher code isn't valid.")
        return
      }
      onChange(result.data)
      setCode("")
    })
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm text-paper/70">
        Voucher code
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            // Inside the checkout form: Enter applies the code rather than placing the order.
            if (event.key === "Enter") {
              event.preventDefault()
              if (code.trim()) apply()
            }
          }}
          placeholder="LR-XXXXXXXX"
          maxLength={24}
          autoComplete="off"
          className="bg-white text-carbon"
          aria-invalid={Boolean(error)}
        />
        <Button type="button" variant="secondary" onClick={apply} disabled={!code.trim() || pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Apply
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : !hasHelmets ? (
        <p className="text-xs text-paper/55">Vouchers are for a custom helmet finish from the builder.</p>
      ) : null}
    </div>
  )
}
