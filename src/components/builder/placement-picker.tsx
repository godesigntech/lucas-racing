"use client"

import { placementLabels } from "@/lib/configurator/helmet-configuration"
import { cn } from "@/lib/utils"
import type { Placement } from "@/types/configurator"

interface PlacementPickerProps {
  label: string
  options: Placement[]
  value: Placement | undefined
  onChange: (value: Placement) => void
  disabled?: boolean
}

/** Where on the helmet something goes, as a row of chips. */
export function PlacementPicker({ label, options, value, onChange, disabled }: PlacementPickerProps) {
  return (
    <fieldset disabled={disabled} className={cn("min-w-0 space-y-2", disabled && "opacity-50")}>
      <legend className="text-xs font-medium text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label key={option} className="cursor-pointer has-disabled:cursor-not-allowed">
            <input
              type="radio"
              name={label}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                value === option ? "border-carbon bg-carbon text-paper" : "border-carbon/15 bg-card hover:border-carbon/40",
              )}
            >
              {placementLabels[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
