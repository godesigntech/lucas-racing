import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { images, type SiteImage } from "@/constants/images"

interface CtaAction {
  label: string
  href: string
}

interface CtaBandProps {
  eyebrow?: string
  title?: string
  description?: string
  primary?: CtaAction
  secondary?: CtaAction
  image?: SiteImage
}

/** Closing call to action used at the bottom of pages. */
export function CtaBand({
  eyebrow = "Lucas Racing · Family run. Race proven.",
  title = "Racing is in our blood",
  description = "Karts, parts, racing support or a custom helmet: talk to the team and we'll help you get on the grid.",
  primary = { label: "Talk to the team", href: "/contact" },
  secondary = { label: "Shop MS Kart", href: "/shop" },
  image = images.teamPhoto,
}: CtaBandProps) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-carbon text-paper">
          <Image src={image.src} alt="" fill sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/30" />
          <div className="relative max-w-2xl space-y-6 px-6 py-14 sm:px-12 sm:py-20">
            <p className="eyebrow text-brand">{eyebrow}</p>
            <h2 className="display text-4xl sm:text-6xl">{title}</h2>
            <p className="text-base leading-relaxed text-paper/70 sm:text-lg">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={primary.href}>
                  {primary.label} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="inverse">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
