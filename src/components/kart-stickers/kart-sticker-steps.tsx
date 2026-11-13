import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const steps = ["Pick layout", "Describe design", "Review AI design", "Send for quote"]

/**
 * Where the customer is: pick a layout, describe the design, review what the AI made,
 * send it for a quote. Earlier steps show a tick; the current one is orange.
 */
export function KartStickerSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Progress" className="rounded-2xl border border-carbon/10 bg-card px-3 py-3 sm:px-5">
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, index) => {
          const step = index + 1
          const done = step < current
          const active = step === current
          return (
            <li key={label} className={cn("flex items-center gap-2", active ? "shrink-0" : "min-w-0", index < steps.length - 1 && (active ? "grow" : "flex-1"))} aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors",
                  active ? "border-brand bg-brand text-carbon" : done ? "border-carbon bg-carbon text-paper" : "border-carbon/20 text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : step}
              </span>
              <span className={cn("truncate text-sm font-semibold", active ? "text-carbon" : done ? "text-carbon/80" : "text-muted-foreground", !active && "max-md:hidden")}>
                {label}
              </span>
              {index < steps.length - 1 && <span aria-hidden className={cn("h-px min-w-3 flex-1", done ? "bg-carbon/60" : "bg-carbon/15")} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
