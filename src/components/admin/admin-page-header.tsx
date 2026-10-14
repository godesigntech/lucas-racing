import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AdminPageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
}

export function AdminPageHeader({ title, description, actions, back }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 space-y-3 sm:mb-8">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-carbon"
        >
          <ArrowLeft className="size-4" aria-hidden /> {back.label}
        </Link>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
