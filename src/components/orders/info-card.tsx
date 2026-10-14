import { cn } from "@/lib/utils"

interface InfoCardProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/** Titled white panel used on order and customer detail pages. */
export function InfoCard({ title, children, action, className }: InfoCardProps) {
  return (
    <section className={cn("rounded-3xl border border-carbon/10 bg-card p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
