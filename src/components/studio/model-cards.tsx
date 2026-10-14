"use client"

import { Check } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { HelmetModel } from "@/types/helmet"

interface ModelCardsProps {
  models: HelmetModel[]
  value: string
  supplyNew: boolean
  onChange: (value: string) => void
}

/** Make/model picker as selectable cards, showing the new-helmet price when we supply it. */
export function ModelCards({ models, value, supplyNew, onChange }: ModelCardsProps) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="eyebrow text-carbon">Make / model</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {models.map((model) => {
          const checked = model.id === value
          return (
            <label key={model.id} className="cursor-pointer">
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={checked}
                onChange={() => onChange(model.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "relative flex h-full flex-col gap-1 rounded-2xl border p-4 transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  checked ? "border-lime-ink bg-accent/60" : "border-carbon/15 bg-card hover:border-carbon/40",
                )}
              >
                {checked && (
                  <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-lime-ink text-paper">
                    <Check className="size-3" aria-hidden />
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{model.brand}</span>
                <span className="font-semibold">{model.name}</span>
                <span className={cn("text-sm", checked ? "text-lime-ink" : "text-muted-foreground")}>
                  {supplyNew ? `+${formatMoney(model.newHelmetPrice)} new helmet` : "Your own helmet"}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
