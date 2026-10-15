"use client"

import { useEffect, useRef } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

import { builderSteps, type BuilderStepId } from "./builder-steps"

interface BuilderStepperProps {
  current: BuilderStepId
  /** Steps the customer has already been through. */
  visited: Set<BuilderStepId>
  onSelect: (step: BuilderStepId) => void
}

/** Numbered steps; any step can be opened. Scrolls sideways on small screens, keeping the current one in view. */
export function BuilderStepper({ current, visited, onSelect }: BuilderStepperProps) {
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    list.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [current])

  return (
    <nav aria-label="Builder steps" className="border-b border-carbon/10">
      <ol ref={list} className="flex gap-1 overflow-x-auto px-3 py-3 [scrollbar-width:none] sm:px-4">
        {builderSteps.map((step, index) => {
          const active = step.id === current
          const done = !active && visited.has(step.id)
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-carbon text-paper" : "text-carbon/70 hover:bg-carbon/5 hover:text-carbon",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[0.68rem] font-bold",
                    active ? "bg-lime text-carbon" : done ? "bg-lime-ink text-paper" : "bg-carbon/10 text-carbon",
                  )}
                >
                  {done ? <Check className="size-3" aria-hidden /> : index + 1}
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
