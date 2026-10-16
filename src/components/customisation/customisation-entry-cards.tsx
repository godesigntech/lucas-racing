import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, BellRing } from "lucide-react"

import { KartPartsBrand } from "@/components/kart-parts/kart-parts-brand"
import { Container } from "@/components/layout/container"
import { helmetPhotos, images } from "@/constants/images"

/** The two ways to customise: helmets now, MS Kart parts by HydroKarts once approved. */
export function CustomisationEntryCards({ partsLive }: { partsLive: boolean }) {
  return (
    <section className="py-14 sm:py-20">
      <Container className="grid gap-6 lg:grid-cols-2">
        <Link
          href="/customisation/helmets"
          className="reveal group relative isolate flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-[2rem] bg-carbon p-8 text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-[32rem] sm:p-10"
        >
          <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_60%_30%,#3a3d3b,#111412_70%)]" />
          <div className="absolute inset-x-6 top-6 -z-10 grid grid-cols-[1.1fr_1fr] items-end sm:inset-x-14 sm:top-8">
            <Image
              src={helmetPhotos.araiSk6.src}
              alt={helmetPhotos.araiSk6.alt}
              width={helmetPhotos.araiSk6.width}
              height={helmetPhotos.araiSk6.height}
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="relative z-10 drop-shadow-[0_30px_30px_rgb(0_0_0/0.5)] transition-transform duration-700 group-hover:-rotate-3 group-hover:scale-105"
            />
            <Image
              src={helmetPhotos.bellKc7.src}
              alt={helmetPhotos.bellKc7.alt}
              width={helmetPhotos.bellKc7.width}
              height={helmetPhotos.bellKc7.height}
              sizes="(min-width: 1024px) 20vw, 40vw"
              className="-ml-8 mb-8 drop-shadow-[0_30px_30px_rgb(0_0_0/0.5)] transition-transform duration-700 group-hover:rotate-3 group-hover:scale-105"
            />
          </div>
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-carbon via-carbon/30 to-transparent" />
          <p className="eyebrow text-brand">Arai SK-6 · Bell KC7</p>
          <h2 className="mt-2 flex items-center justify-between gap-3 font-display text-5xl font-bold uppercase leading-none sm:text-6xl">
            Helmets
            <ArrowUpRight className="size-8 shrink-0 text-brand transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
          </h2>
          <p className="mt-3 max-w-md text-paper/75">
            Pick a design and make it yours in 3D: colours, hydro-dip films, chrome, your name, number and logo.
          </p>
        </Link>

        <Link
          href="/customisation/kart-parts"
          className="reveal group relative isolate flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-[2rem] bg-carbon p-8 text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-[32rem] sm:p-10"
        >
          <Image
            src={images.connor.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="-z-20 object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-carbon via-carbon/50 to-carbon/10" />
          <div className="absolute left-8 top-8 sm:left-10 sm:top-10">
            <KartPartsBrand className="px-4 py-2.5 [&_img]:h-8" />
          </div>
          {!partsLive && (
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full bg-brand px-3.5 py-1 text-sm font-semibold text-carbon">
              <BellRing className="size-4" aria-hidden /> Coming soon
            </span>
          )}
          <p className="eyebrow text-brand">Paint · Hydro-dip · Chrome</p>
          <h2 className="mt-2 flex items-center justify-between gap-3 font-display text-5xl font-bold uppercase leading-none sm:text-6xl">
            Kart parts
            <ArrowUpRight className="size-8 shrink-0 text-brand transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
          </h2>
          <p className="mt-3 max-w-md text-paper/75">
            Genuine MS Kart parts finished to match your helmet: the same paints, films and chrome, done by HydroKarts.
          </p>
        </Link>
      </Container>
    </section>
  )
}
