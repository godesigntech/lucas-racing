import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { helmetPhotos, images } from "@/constants/images"
import { cn } from "@/lib/utils"

interface Category {
  title: string
  description: string
  href: string
  image: { src: string; alt: string }
  /** Cut-out product shots sit on a light panel instead of filling the tile. */
  cutout?: boolean
}

const categories: Category[] = [
  {
    title: "Complete karts",
    description: "MS Kart chassis and race-ready packages",
    href: "/shop/complete-karts",
    image: images.teamAwning,
  },
  {
    title: "Parts and spares",
    description: "Genuine MS Kart parts and components",
    href: "/shop/parts",
    image: images.connor,
  },
  {
    title: "Custom helmets",
    description: "Arai SK-6 and Bell KC7 by HydroKarts",
    href: "/customisation",
    image: helmetPhotos.araiSk6,
    cutout: true,
  },
  {
    title: "Teamwear",
    description: "Hoodies, T-shirts and polos from Wendy's shop",
    href: "/teamwear",
    image: images.wendy,
  },
]

/** The main things to buy, as image tiles. */
export function ShopCategories() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          className="reveal"
          eyebrow="Shop online"
          title="Everything for race day"
          description="Karts, parts, custom helmets and team kit, all in one basket and one checkout."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.title} className="reveal">
              <Link
                href={category.href}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-carbon text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {category.cutout ? (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#3a3d3b,#111412_75%)] p-8">
                    <div className="relative size-full transition-transform duration-500 group-hover:scale-105">
                      <Image src={category.image.src} alt="" fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-contain" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={category.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-t from-carbon via-carbon/40 to-transparent")} />
                <div className="relative space-y-1 p-6">
                  <h3 className="flex items-center justify-between gap-2 font-display text-3xl font-bold uppercase leading-none">
                    {category.title}
                    <ArrowUpRight className="size-5 shrink-0 text-brand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </h3>
                  <p className="text-sm text-paper/75">{category.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
