"use client"

import { Check } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DeliveryMethod } from "@/types/settings"

interface DeliveryOptionsProps {
  methods: DeliveryMethod[]
  value: string
  onChange: (value: string) => void
  error?: string
}

export function DeliveryOptions({ methods, value, onChange, error }: DeliveryOptionsProps) {
  return (
    <fieldset className="min-w-0 space-y-3" aria-describedby={error ? "delivery-error" : undefined}>
      <legend className="sr-only">Delivery option</legend>
      {methods.map((method) => {
        const checked = method.id === value
        return (
          <label
            key={method.id}
            className={cn(
              "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              checked ? "border-carbon bg-carbon/[0.03]" : "border-carbon/15 hover:border-carbon/40",
            )}
          >
            <input
              type="radio"
              name="deliveryMethod"
              value={method.id}
              checked={checked}
              onChange={() => onChange(method.id)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                checked ? "border-carbon bg-carbon text-brand" : "border-carbon/30",
              )}
            >
              {checked && <Check className="size-3" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{method.label}</span>
                <span className="text-sm font-semibold">{method.price ? formatMoney(method.price) : "Free"}</span>
              </span>
              {method.description && <span className="mt-0.5 block text-sm text-muted-foreground">{method.description}</span>}
            </span>
          </label>
        )
      })}
      {error && (
        <p id="delivery-error" role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
