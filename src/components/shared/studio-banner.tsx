import Image from "next/image"

import { Container } from "@/components/layout/container"
import type { SiteImage } from "@/constants/images"

/**
 * A slim dark title strip for the design tools (kart stickers, AI helmet): far shorter
 * than the page hero, so the tool itself starts high on the screen.
 */
export function StudioBanner({ eyebrow, title, description, image }: { eyebrow: string; title: string; description: string; image?: SiteImage }) {
  return (
    <section className="relative isolate overflow-hidden bg-carbon text-paper">
      {image && (
        <>
          <Image src={image.src} alt="" fill preload sizes="100vw" className="-z-20 object-cover object-right opacity-40" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/90 to-carbon/30" />
        </>
      )}
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -left-10 top-0 -z-10 h-full w-40 -skew-x-12 bg-gradient-to-b from-brand/50 to-transparent blur-2xl" />
      <Container className="py-7 sm:py-9">
        <p className="eyebrow text-paper/80">
          <span className="text-brand">/</span> {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold uppercase italic leading-none sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-paper/75 sm:text-base">{description}</p>
      </Container>
    </section>
  )
}
