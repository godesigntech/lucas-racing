"use client"

import { Minus, Plus } from "lucide-react"

import { MAX_QUANTITY } from "@/lib/basket/basket-store"

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  label: string
  /** Highest allowed value (helmets: 10; products: what's in stock). */
  max?: number
}

export function QuantityStepper({ value, onChange, label, max = MAX_QUANTITY }: QuantityStepperProps) {
  const button =
    "grid size-9 place-items-center rounded-full text-carbon transition-colors hover:bg-foreground/5 disabled:opacity-35 disabled:hover:bg-transparent"

  return (
    <div className="inline-flex items-center rounded-full border border-carbon/15 bg-card" role="group" aria-label={label}>
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
