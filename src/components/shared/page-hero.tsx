import Image from "next/image"

import { Container } from "@/components/layout/container"
import type { BrandLogo } from "@/constants/brand"
import type { SiteImage } from "@/constants/images"
import { cn } from "@/lib/utils"

import { SectionHeading } from "./section-heading"

interface PageHeroProps {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  /** Optional photo shown behind the heading, darkened for legibility. */
  image?: SiteImage
  /** A section's own brand (MS Kart, HydroKarts, Delta), shown on a light panel above the heading. */
  logo?: BrandLogo
  /** Custom brand lockup in place of `logo`, e.g. two logos side by side. */
  brand?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** Dark intro band used at the top of inner pages. */
export function PageHero({ eyebrow, title, description, image, logo, brand, children, className }: PageHeroProps) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-carbon text-paper", className)}>
      {image && (
        <>
          <Image src={image.src} alt="" fill preload sizes="100vw" className="-z-20 object-cover opacity-45" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/35" />
        </>
      )}
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-brand/15 blur-3xl" />
      <Container className={cn("relative py-16 sm:py-20 lg:py-24", image && "lg:py-28")}>
        {logo && (
          <div className="mb-8 inline-flex rounded-2xl bg-paper px-5 py-3 shadow-sm">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              preload
              className="h-12 w-auto sm:h-14"
              sizes="320px"
            />
          </div>
        )}
        {brand && <div className="mb-8">{brand}</div>}
        <SectionHeading as="h1" tone="light" eyebrow={eyebrow} title={title} description={description} />
        {children}
      </Container>
    </section>
  )
}
