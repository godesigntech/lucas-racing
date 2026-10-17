import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"

import type { ShopListingItem } from "@/lib/data/shop-listing"
import { formatMoney } from "@/lib/format"
import { isExternalImage } from "@/lib/shop/images"
import { productHref } from "@/lib/shop/part-finish"

import { QuickAddButton } from "./quick-add-button"
import { StockBadge } from "./stock-badge"

/** Product tile for shop grids: photo, name, price, stock and quick add. */
export function ShopProductCard({ item }: { item: ShopListingItem }) {
  // Delta suits are made to order on Delta's site: a starting price, and no stock or basket button.
  const browseOnly = item.storeId === "delta"
  const price = item.minPrice === item.maxPrice && !browseOnly ? formatMoney(item.minPrice) : `From ${formatMoney(item.minPrice)}`
  const onOffer = item.compareAtPrice !== null && item.compareAtPrice > item.minPrice

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.45)] focus-within:ring-3 focus-within:ring-ring/40">
      <div className="relative aspect-square overflow-hidden bg-white">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 50vw"
            unoptimized={isExternalImage(item.imageUrl)}
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Package className="size-10" aria-hidden />
          </div>
        )}
        {onOffer && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-semibold text-carbon">Offer</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {item.brand && <p className="eyebrow text-[0.65rem] text-brand-ink">{item.brand}</p>}
        <h3 className="line-clamp-2 font-semibold leading-snug">
          <Link href={productHref(item)} className="outline-none after:absolute after:inset-0 after:content-['']">
            {item.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="space-y-1.5">
            <p className="font-display text-2xl font-bold leading-none">
              {price}
              {onOffer && <span className="ml-1.5 text-sm font-normal text-muted-foreground line-through">{formatMoney(item.compareAtPrice!)}</span>}
            </p>
            {browseOnly ? (
              <p className="text-xs font-medium text-muted-foreground">Customise and order with Delta</p>
            ) : (
              <StockBadge status={!item.inStock ? "out_of_stock" : item.lowStock ? "low_stock" : "in_stock"} />
            )}
          </div>
          {!browseOnly && <QuickAddButton item={item} />}
        </div>
      </div>
    </article>
  )
}
