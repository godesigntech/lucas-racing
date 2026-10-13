import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

import { SectionHeading } from "./section-heading"

interface PageHeroProps {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** Dark intro band used at the top of inner pages. */
export function PageHero({ eyebrow, title, description, children, className }: PageHeroProps) {
  return (
    <section className={cn("grid-texture relative overflow-hidden bg-carbon text-paper", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-lime/15 blur-3xl"
      />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        <SectionHeading as="h1" tone="light" eyebrow={eyebrow} title={title} description={description} />
        {children}
      </Container>
    </section>
  )
}
