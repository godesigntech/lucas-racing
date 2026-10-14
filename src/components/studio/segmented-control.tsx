"use client"

import { cn } from "@/lib/utils"
import type { ConfigOptionGroup } from "@/types/configurator"

interface SegmentedControlProps {
  group: ConfigOptionGroup
  value: string
  onChange: (value: string) => void
}

/** Two-to-four-way toggle, e.g. "Buy a new helmet" / "Send my own helmet". */
export function SegmentedControl({ group, value, onChange }: SegmentedControlProps) {
  const selected = group.choices.find((choice) => choice.value === value)
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="sr-only">{group.label}</legend>
      <div className="grid gap-1 rounded-2xl bg-carbon/5 p-1" style={{ gridTemplateColumns: `repeat(${group.choices.length}, minmax(0, 1fr))` }}>
        {group.choices.map((choice) => {
          const checked = choice.value === value
          return (
            <label key={choice.value} className="cursor-pointer">
              <input
                type="radio"
                name={group.key}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-11 items-center justify-center rounded-xl px-3 text-center text-sm font-medium transition-all peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  checked ? "bg-card text-carbon shadow-sm ring-1 ring-carbon/10" : "text-muted-foreground hover:text-carbon",
                )}
              >
                {choice.label}
              </span>
            </label>
          )
        })}
      </div>
      {selected?.hint && <p className="text-xs text-muted-foreground">{selected.hint}</p>}
    </fieldset>
  )
}
