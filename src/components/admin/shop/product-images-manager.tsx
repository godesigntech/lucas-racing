"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { setShopProductImages } from "@/lib/actions/admin/shop"
import { uploadProductImage } from "@/lib/shop/product-image"

const MAX_IMAGES = 12

/** Product photos: upload, reorder (the first is the main photo) and remove. Saves straight away. */
export function ProductImagesManager({ productId, images: initial }: { productId: string; images: string[] }) {
  const [images, setImages] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [saving, startSaving] = useTransition()

  function save(next: string[]) {
    const previous = images
    setImages(next)
    startSaving(async () => {
      const result = await setShopProductImages(productId, next)
      if (!result.ok) {
        setImages(previous)
        toast.error(result.message)
      }
    })
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} photos per product.`)
      return
    }
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files).slice(0, room)) urls.push(await uploadProductImage(productId, file))
      save([...images, ...urls])
      toast.success(urls.length === 1 ? "Photo added." : `${urls.length} photos added.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo didn't upload.")
    } finally {
      setUploading(false)
    }
  }

  function move(index: number, by: number) {
    const next = [...images]
    const [image] = next.splice(index, 1)
    next.splice(index + by, 0, image)
    save(next)
  }

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <li key={url} className="group relative overflow-hidden rounded-xl border border-carbon/10 bg-carbon/5">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded photo */}
            <img src={url} alt={`Photo ${index + 1}`} className="aspect-square w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-semibold text-carbon">Main</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-carbon/70 to-transparent p-2">
              <div className="flex gap-1">
                <Button type="button" size="icon-sm" variant="inverse" disabled={index === 0 || saving} onClick={() => move(index, -1)} aria-label={`Move photo ${index + 1} earlier`}>
                  <ArrowLeft />
                </Button>
                <Button type="button" size="icon-sm" variant="inverse" disabled={index === images.length - 1 || saving} onClick={() => move(index, 1)} aria-label={`Move photo ${index + 1} later`}>
                  <ArrowRight />
                </Button>
              </div>
              <Button type="button" size="icon-sm" variant="inverse" disabled={saving} onClick={() => save(images.filter((image) => image !== url))} aria-label={`Remove photo ${index + 1}`}>
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
        {images.length < MAX_IMAGES && (
          <li>
            <label className="grid aspect-square cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed border-carbon/20 text-center text-xs text-muted-foreground transition-colors hover:border-carbon/40 focus-within:ring-3 focus-within:ring-ring/50">
              <span className="grid place-items-center gap-1">
                {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
                {uploading ? "Uploading…" : "Add photos"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void upload(event.target.files)
                  event.target.value = ""
                }}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        Square photos on a plain background work best. The first photo is the main one in the shop.
      </p>
    </div>
  )
}
