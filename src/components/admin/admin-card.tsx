import { cn } from "@/lib/utils"

interface AdminCardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Remove inner padding, e.g. for edge-to-edge tables. */
  flush?: boolean
}

/** White panel used throughout the admin panel. */
export function AdminCard({ title, description, action, children, className, flush }: AdminCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-carbon/10 bg-card", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-carbon/10 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? undefined : "p-5"}>{children}</div>
    </section>
  )
}
