"use client"

import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

import { isExternalImage } from "@/lib/shop/images"
import { cn } from "@/lib/utils"

/** Main product photo with thumbnails to switch between them. */
export function ShopProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-[2rem] border border-carbon/10 bg-card text-muted-foreground">
        <Package className="size-12" aria-hidden />
        <span className="sr-only">No photo yet</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-carbon/10 bg-white">
        <Image src={images[active]} alt={`${title}, photo ${active + 1}`} fill preload sizes="(min-width: 1024px) 45vw, 100vw" unoptimized={isExternalImage(images[active])} className="object-contain p-4" />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Choose a photo">
          {images.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={index === active}
                aria-label={`Photo ${index + 1}`}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow]",
                  index === active ? "border-carbon ring-2 ring-carbon" : "border-carbon/10 hover:border-carbon/40",
                )}
              >
                <Image src={url} alt="" fill sizes="96px" unoptimized={isExternalImage(url)} className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
