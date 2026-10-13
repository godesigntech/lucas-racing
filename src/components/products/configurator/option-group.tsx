"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ConfigOptionGroup } from "@/types/configurator"

interface OptionGroupProps {
  group: ConfigOptionGroup
  value: string
  onChange: (value: string) => void
  disabledReason?: string
  description?: string
}

/** One configurator option rendered as an accessible radio group. */
export function OptionGroup({ group, value, onChange, disabledReason, description }: OptionGroupProps) {
  const disabled = Boolean(disabledReason)
  const selected = group.choices.find((choice) => choice.value === value)
  const helper = disabledReason ?? description ?? group.description

  return (
    <fieldset disabled={disabled} className={cn("min-w-0 space-y-3", disabled && "opacity-55")}>
      <legend className="flex w-full items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{group.label}</span>
        <span className="truncate text-sm text-muted-foreground">{disabled ? "Not used" : selected?.label}</span>
      </legend>

      <div className={cn("flex flex-wrap", group.kind === "swatch" ? "gap-2.5" : "gap-2")}>
        {group.choices.map((choice) => {
          const checked = choice.value === value
          const id = `${group.key}-${choice.value.replace("#", "")}`
          return (
            <label key={choice.value} htmlFor={id} className="relative cursor-pointer has-disabled:cursor-not-allowed">
              <input
                id={id}
                type="radio"
                name={group.key}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="peer sr-only"
              />
              {group.kind === "swatch" ? (
                <span
                  title={choice.label}
                  className={cn(
                    "grid size-10 place-items-center rounded-full ring-1 ring-carbon/15 transition-[box-shadow,transform] peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60 hover:scale-105",
                    checked && "ring-2 ring-carbon ring-offset-2 ring-offset-card",
                  )}
                  style={{ backgroundColor: choice.swatch }}
                >
                  {checked && <Check className="size-4 text-paper mix-blend-difference" aria-hidden />}
                  <span className="sr-only">{choice.label}</span>
                </span>
              ) : (
                <span
                  className={cn(
                    "flex min-h-10 flex-col justify-center rounded-xl border px-3.5 py-2 text-sm transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                    checked
                      ? "border-carbon bg-carbon text-paper"
                      : "border-carbon/15 bg-card hover:border-carbon/40",
                  )}
                >
                  <span className="font-medium">{choice.label}</span>
                  {choice.hint && (
                    <span className={cn("text-xs", checked ? "text-paper/65" : "text-muted-foreground")}>
                      {choice.hint}
                    </span>
                  )}
                </span>
              )}
            </label>
          )
        })}
      </div>

      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </fieldset>
  )
}
