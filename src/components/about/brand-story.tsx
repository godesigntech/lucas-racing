import Image from "next/image"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { images } from "@/constants/images"
import { milestones } from "@/data/about"

export function BrandStory() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <SectionHeading eyebrow="Our story" title="Built on passion. Proven on the circuit." />
          <div className="space-y-4 leading-relaxed text-carbon/80">
            <p>
              For nearly three decades, our family has dedicated itself to competitive karting, combining championship-winning
              experience, technical expertise and a genuine passion for helping drivers succeed.
            </p>
            <p>
              Founded by Howard Lucas, Lucas Racing has grown from a passion for motorsport into one of British karting&apos;s
              established names. Based in Oldham, Greater Manchester, we are the exclusive UK distributor of MS Kart, and our
              racing heritage stretches across national championships, sprint racing and some of the most demanding endurance
              events in the sport.
            </p>
            <p>
              Our achievements include multiple victories at the Le Mans 24 Hours, the UK 24 Hours and numerous British
              championship titles. But success has never been just about trophies. It&apos;s about the experience gained, the
              knowledge shared and helping the next generation of racers achieve their own ambitions.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {milestones.map((item) => (
              <div key={item.value} className="rounded-2xl border border-carbon/10 bg-card p-4">
                <dt className="font-display text-3xl font-extrabold leading-none text-carbon">{item.value}</dt>
                <dd className="mt-1.5 text-xs leading-snug text-muted-foreground">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-[2rem] bg-carbon">
            <Image src={images.kartGrid.src} alt={images.kartGrid.alt} fill sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
          </div>
          <div className="col-span-2 flex flex-col gap-4">
            <div className="relative flex-1 overflow-hidden rounded-[2rem] bg-carbon">
              <Image src={images.raceCorner.src} alt={images.raceCorner.alt} fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-cover" />
            </div>
            <div className="rounded-[2rem] bg-lime p-5 text-carbon">
              <p className="font-display text-3xl font-extrabold leading-none">Family</p>
              <p className="mt-1 text-sm font-medium">When you join Lucas Racing, that&apos;s exactly how we want you to feel.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
