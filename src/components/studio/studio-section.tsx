"use client"

import { useId } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface StudioSectionProps {
  number: number
  title: string
  /** The current choice, shown when the section is closed. */
  summary: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

/** One numbered, collapsible step of the builder. Closed sections show what's chosen. */
export function StudioSection({ number, title, summary, open, onToggle, children }: StudioSectionProps) {
  const panelId = useId()
  return (
    <section className={cn("border-b border-carbon/10 last:border-b-0", open && "bg-paper/40")}>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-carbon/[0.03] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-6"
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full font-display text-base font-bold",
              open ? "bg-lime text-carbon" : "bg-carbon/[0.06] text-carbon",
            )}
          >
            {number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold uppercase leading-tight">{title}</span>
            <span className="block truncate text-sm text-muted-foreground">{summary}</span>
          </span>
          <ChevronDown
            className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </h2>
      <div id={panelId} hidden={!open} className="space-y-6 px-5 pb-6 pt-1 sm:px-6">
        {children}
      </div>
    </section>
  )
}
