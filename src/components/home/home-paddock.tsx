import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Quote } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { images } from "@/constants/images"

/** Life at the circuit: a photo mosaic from the paddock with the team's own words. */
export function HomePaddock() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute -right-48 top-10 -z-10 size-[32rem] rounded-full bg-brand/10 blur-3xl" />
      <Container className="space-y-12">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="In the paddock"
            title={
              <>
                More than a team.
                <span className="block text-brand">A racing family.</span>
              </>
            }
            description="Drivers, parents, mechanics and friends under one awning, every race weekend of the season."
          />
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-1.5 self-start font-semibold underline-offset-4 hover:underline lg:self-auto"
          >
            See the gallery
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <figure className="reveal group relative min-h-72 overflow-hidden rounded-[2rem] bg-carbon sm:col-span-2 lg:row-span-2 lg:min-h-[34rem]">
            <Image
              src={images.teamPhoto.src}
              alt={images.teamPhoto.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-paper sm:p-8">
              <p className="eyebrow text-brand">Race weekend</p>
              <p className="mt-1 font-display text-3xl font-bold uppercase leading-none sm:text-4xl">One team, one awning</p>
            </figcaption>
          </figure>

          <figure className="reveal group relative min-h-60 overflow-hidden rounded-[2rem] bg-carbon sm:col-span-2">
            <Image
              src={images.teamAwning.src}
              alt={images.teamAwning.alt}
              fill
              sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-carbon/70 to-transparent" />
            <figcaption className="absolute bottom-0 left-0 p-6 font-display text-2xl font-bold uppercase leading-none text-paper">
              Lit up after dark
            </figcaption>
          </figure>

          <blockquote className="reveal relative flex min-h-60 flex-col justify-between overflow-clip rounded-[2rem] bg-brand p-6 text-carbon sm:p-7">
            <Quote className="size-8 opacity-80" aria-hidden />
            <p className="font-display text-2xl font-bold uppercase leading-[1.05] sm:text-[1.7rem]">
              It&apos;s about dedication, hard work, friendship and family.
            </p>
            <footer className="eyebrow text-carbon/75">The Lucas family</footer>
            <div aria-hidden className="chequer absolute -right-6 -top-6 size-20 rotate-12 rounded-lg opacity-15" />
          </blockquote>

          <figure className="reveal group relative min-h-60 overflow-hidden rounded-[2rem] bg-carbon">
            <Image
              src={images.fatherAndSon.src}
              alt={images.fatherAndSon.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </figure>
        </div>
      </Container>
    </section>
  )
}
