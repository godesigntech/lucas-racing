import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { images } from "@/constants/images"
import { isExternalImage } from "@/lib/shop/images"
import type { ShopCategory } from "@/types/shop"

// Until a category has its own photo, the shop uses the team's photos in turn.
const fallbacks = [images.teamAwning, images.connor, images.fatherAndSonPaddock, images.teamPhoto]

/** Top-level shop categories as photo tiles. */
export function CategoryTiles({ categories, basePath }: { categories: ShopCategory[]; basePath: string }) {
  if (categories.length === 0) return null
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => {
        const image = category.imageUrl ?? fallbacks[index % fallbacks.length].src
        return (
          <li key={category.id}>
            <Link
              href={`${basePath}/${category.slug}`}
              className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-3xl bg-carbon p-5 text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                unoptimized={isExternalImage(image)}
                className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/40 to-transparent" />
              <span className="relative flex items-center justify-between gap-2 font-display text-2xl font-bold uppercase leading-none">
                {category.name}
                <ArrowUpRight className="size-5 shrink-0 text-brand" aria-hidden />
              </span>
              {category.description && <span className="relative mt-1 line-clamp-1 text-sm text-paper/70">{category.description}</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
