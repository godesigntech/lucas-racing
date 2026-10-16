import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"
import { milestones } from "@/data/about"

/** Homepage opener: who Lucas Racing are, in the first screen. */
export function LucasHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-carbon/10">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[36rem] rounded-full bg-brand/10 blur-3xl" />
      <Container className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:py-20">
        <div className="space-y-7">
          <Image
            src={brandLogos.lucasRacing.src}
            alt={brandLogos.lucasRacing.alt}
            width={brandLogos.lucasRacing.width}
            height={brandLogos.lucasRacing.height}
            preload
            sizes="(min-width: 640px) 320px, 240px"
            className="h-24 w-auto sm:h-32"
          />
          <div className="space-y-4">
            <p className="eyebrow text-brand-ink">Oldham, Greater Manchester · MS Kart since 1999</p>
            <h1 className="display text-[3rem] min-[400px]:text-[3.5rem] sm:text-7xl">
              Family run.
              <span className="block text-brand">Race proven.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-carbon/75 sm:text-lg">
              Lucas Racing is a family-run kart racing team and the exclusive UK distributor of MS Kart. Karts, parts, racing
              support and custom helmets, from people who race every weekend.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/shop">
                Shop MS Kart <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/team">Meet the team</Link>
            </Button>
          </div>
          <dl className="grid max-w-xl grid-cols-3 gap-3 pt-2">
            {milestones.map((item) => (
              <div key={item.value} className="border-l-2 border-brand pl-3">
                <dt className="font-display text-2xl font-extrabold leading-none sm:text-3xl">{item.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-carbon shadow-[0_32px_64px_-32px_rgb(17_20_18/0.6)]">
            <Image
              src={images.fatherAndSonPaddock.src}
              alt={images.fatherAndSonPaddock.alt}
              fill
              preload
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-4 hidden w-[44%] overflow-hidden rounded-2xl border-4 border-paper bg-carbon shadow-xl sm:block lg:-left-10">
            <div className="relative aspect-[16/10]">
              <Image src={images.teamAwning.src} alt={images.teamAwning.alt} fill sizes="22vw" className="object-cover" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
