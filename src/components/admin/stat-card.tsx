import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  highlight?: boolean
}

export function StatCard({ label, value, hint, icon: Icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        highlight ? "border-carbon bg-carbon text-paper" : "border-carbon/10 bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm font-medium", highlight ? "text-paper/65" : "text-muted-foreground")}>{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            highlight ? "bg-lime text-carbon" : "bg-accent text-lime-ink",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-bold leading-none tabular-nums">{value}</p>
      {hint && <p className={cn("mt-2 text-xs", highlight ? "text-paper/55" : "text-muted-foreground")}>{hint}</p>}
    </div>
  )
}
