import Image from "next/image"

import { Container } from "@/components/layout/container"
import type { SiteImage } from "@/constants/images"
import { cn } from "@/lib/utils"

import { SectionHeading } from "./section-heading"

interface PageHeroProps {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  /** Optional photo shown behind the heading, darkened for legibility. */
  image?: SiteImage
  children?: React.ReactNode
  className?: string
}

/** Dark intro band used at the top of inner pages. */
export function PageHero({ eyebrow, title, description, image, children, className }: PageHeroProps) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-carbon text-paper", className)}>
      {image && (
        <>
          <Image src={image.src} alt="" fill preload sizes="100vw" className="-z-20 object-cover opacity-45" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/35" />
        </>
      )}
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-lime/15 blur-3xl" />
      <Container className={cn("relative py-16 sm:py-20 lg:py-24", image && "lg:py-28")}>
        <SectionHeading as="h1" tone="light" eyebrow={eyebrow} title={title} description={description} />
        {children}
      </Container>
    </section>
  )
}
