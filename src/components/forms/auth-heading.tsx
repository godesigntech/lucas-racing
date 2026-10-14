interface AuthHeadingProps {
  eyebrow: string
  title: string
  description: string
}

export function AuthHeading({ eyebrow, title, description }: AuthHeadingProps) {
  return (
    <div className="mb-8 space-y-3">
      <p className="eyebrow text-lime-ink">{eyebrow}</p>
      <h1 className="display text-5xl sm:text-6xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
