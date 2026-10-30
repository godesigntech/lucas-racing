import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"

/** MS Kart sales and racing support: the core of the business. */
export function HomeServices() {
  return (
    <section className="grid-texture bg-carbon py-20 text-paper sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          className="reveal"
          tone="light"
          eyebrow="What we do"
          title="MS Kart sales and racing support"
          description="We don't simply supply products from a catalogue. We race the same equipment we sell, and we support the drivers who use it."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="reveal group flex flex-col overflow-hidden rounded-[2rem] bg-paper text-carbon transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(249_83_18/0.55)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-carbon">
              <Image src={images.connor.src} alt={images.connor.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
              <Image
                src={brandLogos.msKart.src}
                alt={brandLogos.msKart.alt}
                width={brandLogos.msKart.width}
                height={brandLogos.msKart.height}
                sizes="180px"
                className="h-11 w-auto self-start"
              />
              <h3 className="font-display text-3xl font-bold uppercase leading-none">The UK home of MS Kart</h3>
              <p className="leading-relaxed text-carbon/75">
                Exclusive UK distributor since 1999. Complete karts, chassis, genuine spare parts and specialist components for
                sprint and endurance racing, with setup advice from the team.
              </p>
              <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
                <Button asChild>
                  <Link href="/shop/prokart">
                    Prokart <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/shop/spare-parts">Spare parts</Link>
                </Button>
              </div>
            </div>
          </article>

          <article className="reveal group flex flex-col overflow-hidden rounded-[2rem] bg-paper text-carbon transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(249_83_18/0.55)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-carbon">
              <Image
                src={images.connorCoaching.src}
                alt={images.connorCoaching.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
              <p className="eyebrow text-brand-ink">Racing support</p>
              <h3 className="font-display text-3xl font-bold uppercase leading-none">Support at every stage</h3>
              <p className="leading-relaxed text-carbon/75">
                Kart preparation, setup advice, technical support and driver development, from young drivers finding their feet
                to experienced racers chasing tenths, at the circuit and away from it.
              </p>
              <div className="mt-auto pt-2">
                <Button asChild variant="secondary">
                  <Link href="/about/racing-support">
                    Racing support <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  )
}
