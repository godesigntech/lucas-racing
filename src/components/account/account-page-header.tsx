interface AccountPageHeaderProps {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function AccountPageHeader({ title, description, actions }: AccountPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <h1 className="display text-5xl sm:text-6xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
