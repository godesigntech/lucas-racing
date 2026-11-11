"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { createClient, uploadFile } from "@/lib/supabase/browser"

const LOGO_BUCKET = "design-logos"
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }
const LOGO_MAX_BYTES = 5 * 1024 * 1024

/** Wording for what is being uploaded: a sponsor logo by default, or a print for a bespoke film. */
export interface UploadCopy {
  title: string
  action: string
  hint: string
  note: string
  noun: string
}

const logoCopy: UploadCopy = {
  title: "Logo or sponsor",
  action: "Upload a logo",
  hint: "PNG with a transparent background works best. Up to 5 MB.",
  note: "We'll place it on your proof for you to approve.",
  noun: "logo",
}

/** Uploads a customer's image (a logo, or artwork for a bespoke print) to their private folder. Signed-in customers only. */
export function LogoUpload({
  path,
  onChange,
  onUrl,
  returnTo,
  copy = logoCopy,
}: {
  path?: string
  onChange: (path: string) => void
  /** Told the image's link once it's known, so the 3D preview can show it. */
  onUrl?: (path: string, url: string) => void
  returnTo: string
  copy?: UploadCopy
}) {
  const inputId = useId()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Logos are stored in the customer's own folder, so uploading needs an account.
  useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getSession()
      .then(({ data }) => !cancelled && setUserId(data.session?.user.id ?? null))
    return () => {
      cancelled = true
    }
  }, [])

  // Show a saved logo (e.g. reopened from the basket or a saved design).
  useEffect(() => {
    if (!path || previewUrl) return
    let cancelled = false
    createClient()
      .storage.from(LOGO_BUCKET)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (cancelled || !data) return
        setPreviewUrl(data.signedUrl)
        onUrl?.(path, data.signedUrl)
      })
    return () => {
      cancelled = true
    }
  }, [path, previewUrl, onUrl])

  async function upload(file: File | undefined) {
    if (!file || !userId) return
    const extension = LOGO_TYPES[file.type]
    if (!extension) return toast.error("Please choose a PNG, JPG or WebP image.")
    if (file.size > LOGO_MAX_BYTES) return toast.error(`That ${copy.noun} is over 5 MB. Please choose a smaller file.`)

    setUploading(true)
    try {
      const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`
      const { error } = await uploadFile(LOGO_BUCKET, objectPath, file, { contentType: file.type })
      if (error) throw error
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      onUrl?.(objectPath, localUrl)
      onChange(objectPath)
    } catch {
      toast.error(`Your ${copy.noun} didn't upload. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">
        {copy.title} <span className="font-normal text-muted-foreground">(optional)</span>
      </p>
      {path ? (
        <div className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-paper/60 p-2 pr-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-card ring-1 ring-carbon/10">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- private signed URL or local preview
              <img src={previewUrl} alt={`Your ${copy.noun}`} className="size-full object-contain" />
            ) : (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            )}
          </span>
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{copy.note}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreviewUrl(null)
              onChange("")
            }}
          >
            <X /> Remove
          </Button>
        </div>
      ) : userId === null ? (
        <p className="rounded-xl border border-dashed border-carbon/20 px-4 py-3 text-sm text-muted-foreground">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="font-semibold text-carbon underline-offset-4 hover:underline">
            Log in
          </Link>{" "}
          to add your own {copy.noun}.
        </p>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-carbon/20 px-4 py-3 text-sm transition-colors hover:border-carbon/40 focus-within:ring-3 focus-within:ring-ring/50"
        >
          {uploading ? <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden /> : <ImagePlus className="size-5 text-muted-foreground" aria-hidden />}
          <span>
            <span className="font-semibold">{uploading ? "Uploading…" : copy.action}</span>
            <span className="block text-xs text-muted-foreground">{copy.hint}</span>
          </span>
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={uploading || userId === undefined}
            onChange={(event) => {
              void upload(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </label>
      )}
    </div>
  )
}
