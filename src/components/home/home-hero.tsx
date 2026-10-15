import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { helmetPhotos, images } from "@/constants/images"

const heroTags = [
  { label: "Shell", value: "Bell KC7", className: "right-[2%] top-[4%]" },
  { label: "Shell", value: "Arai SK-6", className: "bottom-[10%] left-[0%]" },
  { label: "Finish", value: "Hydro-dip films & chrome", className: "bottom-[2%] right-[4%]" },
]

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-carbon text-paper">
      <Image
        src={images.heroKarts.src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-center opacity-45"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/90 to-carbon/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-carbon to-transparent" />
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 -z-10 size-[32rem] rounded-full bg-lime/10 blur-3xl" />
      <Container className="relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-24">
        <div className="space-y-7">
          <p className="eyebrow inline-flex items-center gap-2 text-lime">
            <span className="h-px w-8 bg-lime" aria-hidden />
            Lucas Racing × Hydro Karts
          </p>
          <h1 className="display text-[2.75rem] min-[400px]:text-[3.25rem] sm:text-7xl xl:text-[5.6rem]">
            Built for the grid.
            <br />
            <span className="text-lime">Designed by you.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
            Custom Arai SK-6 and Bell KC7 helmets with racing-line templates, hydro-dip films and in-house chrome. Add your
            name, number and trim colours, then approve every detail before we dip a thing.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/helmet-builder">
                Customise my helmet
                <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="/products">Browse designs</Link>
            </Button>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              ["2", "Launch shells"],
              ["20", "Templates at launch"],
              ["1", "UK workshop"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-bold leading-none text-paper">{value}</dd>
                <dd className="mt-1 text-xs text-paper/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden className="absolute inset-[12%] rounded-full bg-lime/20 blur-2xl" />
          <div aria-hidden className="absolute inset-[8%] rounded-full border border-white/10" />
          <div aria-hidden className="absolute inset-[20%] rounded-full border border-dashed border-white/10" />
          {/* Bell KC7 sits behind, the Arai SK-6 in front; both face the headline. */}
          <div className="relative aspect-[6/5] w-full">
            <Image
              src={helmetPhotos.bellKc7.src}
              alt={helmetPhotos.bellKc7.alt}
              width={helmetPhotos.bellKc7.width}
              height={helmetPhotos.bellKc7.height}
              preload
              sizes="(min-width: 1024px) 26vw, 55vw"
              className="absolute right-[2%] top-[2%] w-[56%] drop-shadow-[0_24px_30px_rgb(0_0_0/0.5)]"
            />
            <Image
              src={helmetPhotos.araiSk6.src}
              alt={helmetPhotos.araiSk6.alt}
              width={helmetPhotos.araiSk6.width}
              height={helmetPhotos.araiSk6.height}
              preload
              sizes="(min-width: 1024px) 34vw, 70vw"
              className="absolute bottom-[4%] left-[2%] w-[70%] drop-shadow-[0_30px_40px_rgb(0_0_0/0.55)]"
            />
          </div>
          {heroTags.map((tag) => (
            <div
              key={tag.value}
              className={`absolute hidden rounded-2xl border border-white/10 bg-carbon-2/85 px-3.5 py-2 backdrop-blur sm:block ${tag.className}`}
            >
              <p className="eyebrow text-[0.62rem] text-lime">{tag.label}</p>
              <p className="text-sm font-medium text-paper">{tag.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
