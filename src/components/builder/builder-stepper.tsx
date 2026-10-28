"use client"

import { useEffect, useRef } from "react"
import { Check, Lock } from "lucide-react"

import { cn } from "@/lib/utils"

import { builderSteps, type BuilderStepId } from "./builder-steps"

interface BuilderStepperProps {
  current: BuilderStepId
  /** Steps the customer has already been through. */
  visited: Set<BuilderStepId>
  onSelect: (step: BuilderStepId) => void
}

/**
 * All sixteen steps of the journey, grouped by what they're about, with a progress bar.
 * The build steps can be opened in any order; confirming the order and production come
 * after the basket, so they're shown but not clickable.
 */
export function BuilderStepper({ current, visited, onSelect }: BuilderStepperProps) {
  const list = useRef<HTMLOListElement>(null)
  const index = builderSteps.findIndex((step) => step.id === current)
  const progress = ((index + 1) / builderSteps.length) * 100

  useEffect(() => {
    list.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [current])

  return (
    <nav aria-label="Builder steps" className="border-b border-carbon/10">
      <div className="px-4 pt-3 sm:px-5">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            {builderSteps[index]?.group}
          </span>
          <span className="text-muted-foreground">
            Step {index + 1} of {builderSteps.length}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-carbon/10" role="presentation">
          <span className="block h-full rounded-full bg-brand-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol ref={list} className="flex gap-1 overflow-x-auto px-3 py-3 [scrollbar-width:none] sm:px-4">
        {builderSteps.map((step, position) => {
          const active = step.id === current
          const done = !active && visited.has(step.id)
          const later = step.stage !== "build"
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                disabled={later}
                aria-current={active ? "step" : undefined}
                title={later ? "This happens after your basket" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-carbon text-paper" : "text-carbon/70 hover:bg-carbon/5 hover:text-carbon",
                  later && "cursor-default text-carbon/35 hover:bg-transparent hover:text-carbon/35",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[0.68rem] font-bold",
                    active ? "bg-brand text-carbon" : done ? "bg-brand-ink text-paper" : "bg-carbon/10 text-carbon",
                  )}
                >
                  {later ? <Lock className="size-2.5" aria-hidden /> : done ? <Check className="size-3" aria-hidden /> : position + 1}
                </span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
