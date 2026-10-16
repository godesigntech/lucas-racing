"use client"

import { Check } from "lucide-react"

import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConfiguratorOption } from "@/types/catalog"

interface SwatchGridProps {
  label: string
  options: ConfiguratorOption[]
  value: string | undefined
  onChange: (value: string) => void
  size?: "md" | "lg"
}

/** Colour swatches as a radio group, with the chosen colour's name shown above. */
export function SwatchGrid({ label, options, value, onChange, size = "md" }: SwatchGridProps) {
  const selected = options.find((option) => option.value === value)
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="flex w-full items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="truncate text-muted-foreground">
          {selected?.label ?? "Choose a colour"}
          {selected && formatSurcharge(selected.price) && (
            <span className="ml-1.5 font-medium text-brand-ink">{formatSurcharge(selected.price)}</span>
          )}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label key={option.value} className="cursor-pointer" title={option.label}>
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "grid place-items-center rounded-full ring-1 ring-carbon/15 transition-[box-shadow,transform] hover:scale-105 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60",
                  size === "lg" ? "size-12" : "size-10",
                  checked && "ring-2 ring-carbon ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: option.swatch ?? option.value }}
              >
                {checked && <Check className="size-4 text-paper mix-blend-difference" aria-hidden />}
                <span className="sr-only">
                  {option.label}
                  {formatSurcharge(option.price) && ` ${formatSurcharge(option.price)}`}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
