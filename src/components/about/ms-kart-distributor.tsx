import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CircleCheck } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { services } from "@/data/about"

/** Lucas Racing's MS Kart distribution and the services that come with it. */
export function MsKartDistributor() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative order-last aspect-[4/3] overflow-hidden rounded-[2rem] bg-carbon lg:order-first">
          <Image src={images.teamAwning.src} alt={images.teamAwning.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          <span className="absolute left-5 top-5 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-carbon">
            Exclusive UK distributor
          </span>
        </div>
        <div className="space-y-6">
          <Image
            src={brandLogos.msKart.src}
            alt={brandLogos.msKart.alt}
            width={brandLogos.msKart.width}
            height={brandLogos.msKart.height}
            sizes="220px"
            className="h-14 w-auto"
          />
          <SectionHeading eyebrow="MS Kart" title="Everything you need to get racing" />
          <div className="space-y-4 leading-relaxed text-carbon/80">
            <p>
              Lucas Racing is proud to be the exclusive UK distributor of MS Kart, the respected Czech racing kart manufacturer.
              Our relationship dates back to 1999, a partnership built on racing success, technical development and a shared
              commitment to quality.
            </p>
            <p>
              We supply genuine MS Kart chassis, replacement parts and specialist components throughout the UK, for Prokart
              sprint and endurance racing and other karting disciplines. We don&apos;t simply supply products from a catalogue:
              we understand how they work, how they perform and what drivers need to get the best from them.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service} className="flex gap-2.5 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />
                {service}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/shop">
                MS Kart parts shop <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
