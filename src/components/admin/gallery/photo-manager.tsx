"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addPhotos, deletePhoto, reorderPhotos, setAlbumCover, updatePhotoCaption } from "@/lib/actions/admin/gallery"
import { uploadGalleryPhoto, type UploadedPhoto } from "@/lib/gallery/upload"
import { cn } from "@/lib/utils"
import type { GalleryAlbumWithPhotos } from "@/types/gallery"

/**
 * Upload many photos at once (each resized in the browser first), add captions, reorder,
 * choose the cover and delete. Changes save straight away.
 */
export function PhotoManager({ album }: { album: GalleryAlbumWithPhotos }) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const photos = album.photos

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = [...files].slice(0, 100)
    setProgress({ done: 0, total: list.length })
    const uploaded: UploadedPhoto[] = []
    // A few at a time: quick, without overwhelming a phone connection.
    for (let index = 0; index < list.length; index += 3) {
      const batch = await Promise.allSettled(list.slice(index, index + 3).map((file) => uploadGalleryPhoto(file)))
      for (const result of batch) {
        if (result.status === "fulfilled") uploaded.push(result.value)
        else toast.error(result.reason instanceof Error ? result.reason.message : "A photo didn't upload.")
      }
      setProgress({ done: Math.min(list.length, index + 3), total: list.length })
    }
    if (uploaded.length) {
      const result = await addPhotos(album.id, uploaded)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    }
    setProgress(null)
    if (input.current) input.current.value = ""
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>, quiet = false) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) toast.error(result.message ?? "Something went wrong.")
      else if (!quiet && result.message) toast.success(result.message)
    })
  }

  function move(position: number, step: number) {
    const ids = photos.map((photo) => photo.id)
    const target = position + step
    if (target < 0 || target >= ids.length) return
    ;[ids[position], ids[target]] = [ids[target], ids[position]]
    run(() => reorderPhotos(album.id, ids), true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => input.current?.click()} disabled={Boolean(progress)}>
          {progress ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus />}
          {progress ? `Uploading ${progress.done} of ${progress.total}…` : "Add photos"}
        </Button>
        <p className="text-sm text-muted-foreground">Choose several at once. Photos are resized before they upload.</p>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(event) => upload(event.target.files)} />
      </div>

      {photos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-carbon/20 px-6 py-12 text-center text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-70")}>
          {photos.map((photo, position) => {
            const isCover = album.coverUrl === photo.imageUrl
            return (
              <li key={photo.id} className="overflow-hidden rounded-2xl border border-carbon/10 bg-card">
                <div className="relative aspect-[4/3] bg-carbon/5">
                  <Image src={photo.imageUrl} alt={photo.caption || `Photo ${position + 1}`} fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
                  {isCover && <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-carbon">Cover</span>}
                </div>
                <div className="space-y-2 p-3">
                  <Input
                    defaultValue={photo.caption}
                    placeholder="Caption (optional)"
                    aria-label={`Caption for photo ${position + 1}`}
                    maxLength={300}
                    onBlur={(event) => {
                      if (event.target.value.trim() !== photo.caption) run(() => updatePhotoCaption(album.id, photo.id, event.target.value))
                    }}
                  />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="Move earlier" disabled={position === 0 || pending} onClick={() => move(position, -1)}>
                        <ArrowLeft />
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="Move later" disabled={position === photos.length - 1 || pending} onClick={() => move(position, 1)}>
                        <ArrowRight />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" disabled={isCover || pending} onClick={() => run(() => setAlbumCover(album.id, photo.imageUrl))}>
                        <Star /> Cover
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete photo ${position + 1}`}
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm("Delete this photo from the album?")) run(() => deletePhoto(album.id, photo.id))
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
