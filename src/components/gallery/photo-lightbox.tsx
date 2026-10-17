"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { GalleryPhoto } from "@/types/gallery"

/**
 * An album's photo grid with a lightbox. Keyboard: Enter opens a photo, arrow keys move
 * between photos, Escape closes (the dialog keeps focus inside while it's open).
 */
export function PhotoLightbox({ photos, albumTitle }: { photos: GalleryPhoto[]; albumTitle: string }) {
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null
  const photo = open ? photos[index] : null

  const go = useCallback((step: number) => setIndex((current) => (current === null ? current : (current + step + photos.length) % photos.length)), [photos.length])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1)
      if (event.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go])

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {photos.map((item, position) => (
          <li key={item.id} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setIndex(position)}
              className="group block w-full overflow-hidden rounded-2xl bg-carbon/5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`Open photo ${position + 1} of ${photos.length}${item.caption ? `: ${item.caption}` : ""}`}
            >
              <Image
                src={item.imageUrl}
                alt={item.caption || `${albumTitle}, photo ${position + 1}`}
                width={item.width ?? 1200}
                height={item.height ?? 800}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(next) => !next && setIndex(null)}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden border-0 bg-carbon p-0 text-paper ring-0 sm:max-w-5xl">
          {photo && (
            <>
              <DialogTitle className="sr-only">
                {albumTitle}, photo {index! + 1} of {photos.length}
              </DialogTitle>
              <DialogDescription className="sr-only">Use the arrow keys to move between photos and Escape to close.</DialogDescription>
              <div className="relative flex max-h-[80dvh] items-center justify-center bg-black">
                <Image
                  key={photo.id}
                  src={photo.imageUrl}
                  alt={photo.caption || `${albumTitle}, photo ${index! + 1}`}
                  width={photo.width ?? 1600}
                  height={photo.height ?? 1067}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="max-h-[80dvh] w-auto object-contain"
                  preload
                />
                {photos.length > 1 && (
                  <>
                    <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={navButton("left-3")}>
                      <ChevronLeft className="size-6" aria-hidden />
                    </button>
                    <button type="button" onClick={() => go(1)} aria-label="Next photo" className={navButton("right-3")}>
                      <ChevronRight className="size-6" aria-hidden />
                    </button>
                  </>
                )}
                <DialogClose aria-label="Close" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-carbon/70 text-paper outline-none hover:bg-carbon focus-visible:ring-3 focus-visible:ring-brand">
                  <X className="size-5" aria-hidden />
                </DialogClose>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <p className="min-w-0 text-paper/85">{photo.caption || albumTitle}</p>
                <p className="shrink-0 font-mono text-xs text-paper/60">
                  {index! + 1} / {photos.length}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

const navButton = (side: string) =>
  cn(
    "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-carbon/70 text-paper outline-none transition-colors hover:bg-carbon focus-visible:ring-3 focus-visible:ring-brand",
    side,
  )
