import Image from "next/image"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { images } from "@/constants/images"

export function BrandStory() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <SectionHeading eyebrow="Our story" title="Two teams, one helmet" />
          <div className="space-y-4 leading-relaxed text-carbon/80">
            <p>
              Lucas Racing is a UK kart race team. A driver’s helmet is the one piece of kit everyone sees, on the grid and
              in every photo, so we wanted custom designs to be easy to get right.
            </p>
            <p>
              Hydro Karts is run by twin brothers who customise race helmets with hydro-dip films, chrome and hand-masked
              racing lines. They are now part of the Lucas Racing team, and every helmet we sell is finished in their
              workshop.
            </p>
            <p>
              This site brings the two together: choose a design, make it yours, approve the proof, and get it back ready to
              race.
            </p>
          </div>
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
              <p className="font-display text-4xl font-extrabold leading-none">UK</p>
              <p className="mt-1 text-sm font-medium">Designed, dipped and lacquered in our own workshop</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
