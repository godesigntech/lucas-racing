import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { images } from "@/constants/images"

const shops = [
  {
    eyebrow: "Delta Racewear",
    title: "Custom race suits",
    description: "Delta Racewear, available through Lucas Racing. Browse the range, then design and order your suit with Delta.",
    href: "/racewear",
    cta: "Explore racewear",
    image: images.fatherAndSonPaddock,
  },
  {
    eyebrow: "Wendy's Teamwear",
    title: "Wear the team colours",
    description: "Lucas Racing hoodies, sweatshirts, T-shirts and polo shirts, looked after by Wendy.",
    href: "/teamwear",
    cta: "Shop teamwear",
    image: images.wendy,
  },
]

/** Racewear and teamwear promos. */
export function PartnerShops() {
  return (
    <section className="pb-20 sm:pb-24">
      <Container className="grid gap-6 lg:grid-cols-2">
        {shops.map((shop) => (
          <Link
            key={shop.href}
            href={shop.href}
            className="reveal group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-carbon p-8 text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-10"
          >
            <Image
              src={shop.image.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="-z-20 object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-carbon via-carbon/60 to-carbon/10" />
            <p className="eyebrow text-brand">{shop.eyebrow}</p>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{shop.title}</h2>
            <p className="mt-3 max-w-md text-paper/75">{shop.description}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 font-semibold">
              {shop.cta}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </Container>
    </section>
  )
}
