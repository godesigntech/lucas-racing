import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Package } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { isExternalImage } from "@/lib/shop/images"
import { finishLabels, lowestFinishExtra, productHref } from "@/lib/shop/part-finish"
import type { PriceBook } from "@/types/catalog"
import type { ShopProduct } from "@/types/shop"

/** A customisable part: photo, name, the finishes it comes in and its starting price. */
export function CustomPartCard({ product, priceBook }: { product: ShopProduct; priceBook: PriceBook }) {
  const image = product.images[0]
  const from = Math.min(...product.variants.map((variant) => variant.price)) + lowestFinishExtra(product, priceBook)

  return (
    <Link
      href={productHref(product)}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card outline-none transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.45)] focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            unoptimized={isExternalImage(image)}
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Package className="size-10" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="flex items-start justify-between gap-2 font-display text-2xl font-bold uppercase leading-none">
          {product.title}
          <ArrowUpRight className="size-5 shrink-0 text-brand-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {product.customFinishes.map((type) => (
            <li key={type} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {finishLabels[type]}
            </li>
          ))}
        </ul>
        <p className="mt-auto font-semibold">From {formatMoney(from)}</p>
      </div>
    </Link>
  )
}
