import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "left" | "center"
  tone?: "dark" | "light"
  as?: "h1" | "h2"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl space-y-4", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("eyebrow", tone === "dark" ? "text-brand-ink" : "text-brand")}>{eyebrow}</p>
      )}
      <Heading
        className={cn(
          "display",
          Heading === "h1" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl",
          tone === "dark" ? "text-carbon" : "text-paper",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className={cn("text-base leading-relaxed sm:text-lg", tone === "dark" ? "text-muted-foreground" : "text-paper/70")}>
          {description}
        </p>
      )}
    </div>
  )
}
