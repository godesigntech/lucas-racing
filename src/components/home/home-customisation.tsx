import type { CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Box, Droplets, Sparkles } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { helmetPhotos } from "@/constants/images"
import { getPriceBook } from "@/lib/data/products"

const highlights = [
  { icon: Box, text: "Design it step by step and turn it in 3D" },
  { icon: Droplets, text: "Hundreds of hydro-dip films, paint and in-house chrome" },
  { icon: Sparkles, text: "Your name, number and logos, approved on a proof first" },
]

// Where the film swatches float around the helmets (large screens).
const chipSpots = [
  "left-[2%] top-[8%] -rotate-12",
  "right-[4%] top-[2%] rotate-6",
  "left-[-4%] bottom-[30%] rotate-12",
  "right-[-2%] bottom-[34%] -rotate-6",
  "left-[16%] bottom-[2%] rotate-3",
  "right-[18%] bottom-[-2%] -rotate-12",
]

/** Customisation by HydroKarts: helmets now, bespoke MS Kart parts next. Dark and colourful. */
export async function HomeCustomisation() {
  const { films } = await getPriceBook()
  // One swatch from each of the first few collections, for colour variety.
  const swatches = [...new Map(films.filter((film) => film.thumbUrl).map((film) => [film.category, film])).values()].slice(0, chipSpots.length)

  return (
    <section className="relative isolate overflow-hidden bg-carbon py-20 text-paper sm:py-28">
      <div aria-hidden className="grid-texture absolute inset-0 -z-20" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 -z-10 size-[30rem] rounded-full bg-brand/30 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[26rem] rounded-full bg-[#c6f432]/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-[28rem] rounded-full bg-[#2f6bff]/25 blur-[130px]" />

      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="reveal space-y-7">
          <span className="inline-flex rounded-2xl bg-paper px-4 py-2.5">
            <Image
              src={brandLogos.lucasRacingByHydroKarts.src}
              alt={brandLogos.lucasRacingByHydroKarts.alt}
              width={brandLogos.lucasRacingByHydroKarts.width}
              height={brandLogos.lucasRacingByHydroKarts.height}
              sizes="(min-width: 640px) 300px, 240px"
              className="h-10 w-auto sm:h-12"
            />
          </span>
          <h2 className="display text-5xl sm:text-7xl">
            Customisation,
            <span className="block bg-gradient-to-r from-brand via-[#ffd000] to-[#c6f432] bg-clip-text pb-1 text-transparent">
              your colours
            </span>
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-paper/75">
            Custom Arai SK-6 and Bell KC7 kart helmets, designed with you and finished by HydroKarts. MS Kart parts in your own
            finish are on the way.
          </p>
          <ul className="grid gap-3 sm:grid-cols-1">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-carbon">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-paper/90">{text}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/helmet-builder">
                Design your helmet <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="/customisation/helmets">Browse designs</Link>
            </Button>
          </div>
          <Link
            href="/customisation"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            Everything we customise, including MS Kart parts <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="reveal relative mx-auto aspect-square w-full max-w-xl">
          {/* Glowing ring behind the helmets. */}
          <div aria-hidden className="absolute inset-[8%] rounded-full bg-[conic-gradient(from_0deg,#f95312,#ffd000,#c6f432,#2f6bff,#f95312)] opacity-80 blur-2xl spin-slow" />
          <div aria-hidden className="absolute inset-[14%] rounded-full bg-carbon/90" />
          <div aria-hidden className="absolute inset-[14%] rounded-full ring-1 ring-white/10" />

          <div className="absolute inset-[10%] grid grid-cols-[1.1fr_1fr] items-center">
            <Image
              src={helmetPhotos.araiSk6.src}
              alt={helmetPhotos.araiSk6.alt}
              width={helmetPhotos.araiSk6.width}
              height={helmetPhotos.araiSk6.height}
              sizes="(min-width: 1024px) 26vw, 50vw"
              className="relative z-10 drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]"
            />
            <Image
              src={helmetPhotos.bellKc7.src}
              alt={helmetPhotos.bellKc7.alt}
              width={helmetPhotos.bellKc7.width}
              height={helmetPhotos.bellKc7.height}
              sizes="(min-width: 1024px) 24vw, 45vw"
              className="-ml-8 mt-16 drop-shadow-[0_30px_40px_rgb(0_0_0/0.6)]"
            />
          </div>

          {swatches.map((film, index) => (
            <div
              key={film.id}
              aria-hidden
              className={`float-slow absolute hidden size-14 overflow-hidden rounded-xl shadow-[0_12px_30px_-8px_rgb(0_0_0/0.7)] ring-2 ring-white/20 sm:block sm:size-16 ${chipSpots[index]}`}
              style={{ "--float-delay": `${index * -1.1}s` } as CSSProperties}
            >
              <Image src={film.thumbUrl!} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
