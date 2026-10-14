import Link from "next/link"

import { cn } from "@/lib/utils"

interface FilterTab {
  value: string
  label: string
  count?: number
}

interface FilterTabsProps {
  tabs: FilterTab[]
  active: string
  /** Builds the link for a tab value ("" for "all"). */
  hrefFor: (value: string) => string
  label: string
}

/** Link-based filter pills, so filtered views have their own URL. */
export function FilterTabs({ tabs, active, hrefFor, label }: FilterTabsProps) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1.5">
        {tabs.map((tab) => {
          const selected = tab.value === active
          return (
            <li key={tab.value} className="shrink-0">
              <Link
                href={hrefFor(tab.value)}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-carbon bg-carbon text-paper"
                    : "border-carbon/15 bg-card text-carbon/75 hover:border-carbon/40 hover:text-carbon",
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      selected ? "bg-white/15" : "bg-carbon/5 text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
