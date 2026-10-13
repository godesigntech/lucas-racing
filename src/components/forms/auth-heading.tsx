import { Info } from "lucide-react"

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
      <p className="flex items-start gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs text-accent-foreground">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        Accounts open soon. This preview checks your details but doesn&apos;t create or sign in to an account.
      </p>
    </div>
  )
}
