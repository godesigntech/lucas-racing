import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { images, type SiteImage } from "@/constants/images"
import { cn } from "@/lib/utils"

interface Tile {
  image: SiteImage
  caption: string
  className: string
  sizes: string
}

const tiles: Tile[] = [
  { image: images.cornerKart, caption: "Club racing", className: "sm:col-span-2 sm:row-span-2", sizes: "(min-width: 640px) 50vw, 100vw" },
  { image: images.helmetCloseUp, caption: "Custom finishes", className: "", sizes: "(min-width: 640px) 25vw, 100vw" },
  { image: images.orangeKart, caption: "Race day", className: "", sizes: "(min-width: 640px) 25vw, 100vw" },
  { image: images.pack, caption: "Wheel to wheel", className: "sm:col-span-2", sizes: "(min-width: 640px) 50vw, 100vw" },
]

/** Photo mosaic that sets the race-day mood between the product sections. */
export function TrackGallery() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Built for race day"
            title="Seen at every corner"
            description="A helmet is the one piece of kit everyone sees: on the grid, in the paddock and in every photo."
          />
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 self-start text-sm font-semibold underline-offset-4 hover:underline md:self-auto"
          >
            Find your design
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <ul className="grid auto-rows-[14rem] gap-4 sm:grid-cols-4 sm:auto-rows-[13rem] lg:auto-rows-[15rem]">
          {tiles.map((tile) => (
            <li key={tile.caption} className={cn("group relative overflow-hidden rounded-3xl bg-carbon", tile.className)}>
              <Image
                src={tile.image.src}
                alt={tile.image.alt}
                fill
                sizes={tile.sizes}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/75 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-4 rounded-full bg-carbon/70 px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-wider text-paper backdrop-blur">
                {tile.caption}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
