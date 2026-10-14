"use client"

import { cn } from "@/lib/utils"

import { studioSteps, type StudioStepId } from "./studio-steps"

interface StepTabsProps {
  current: StudioStepId
  onSelect: (step: StudioStepId) => void
}

/** Numbered step tabs across the top of the studio panel. Any step can be opened directly. */
export function StepTabs({ current, onSelect }: StepTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Build steps"
      className="flex overflow-x-auto border-b border-carbon/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {studioSteps.map((step, index) => {
        const selected = step.id === current
        return (
          <button
            key={step.id}
            type="button"
            role="tab"
            id={`studio-tab-${step.id}`}
            aria-selected={selected}
            aria-controls={`studio-panel-${step.id}`}
            onClick={() => onSelect(step.id)}
            className={cn(
              "relative flex shrink-0 grow items-baseline justify-center gap-1.5 px-2.5 py-4 text-[0.8rem] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
              selected ? "font-semibold text-carbon" : "text-muted-foreground hover:text-carbon",
            )}
          >
            <span className="font-mono text-[0.7rem] tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            {step.label}
            <span
              aria-hidden
              className={cn("absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-colors", selected ? "bg-lime-ink" : "bg-transparent")}
            />
          </button>
        )
      })}
    </div>
  )
}
