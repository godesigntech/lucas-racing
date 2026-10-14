"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type MoneyInputProps = Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> & {
  value: number
  onChange: (value: number) => void
}

/** Pound amount input that always reports a number to react-hook-form. */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden>
        £
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))}
        className={cn("pl-8 tabular-nums", className)}
        {...props}
      />
    </div>
  )
}
