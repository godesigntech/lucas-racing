import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-carbon/20 bg-card px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-brand-ink">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold uppercase">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
