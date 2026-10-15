"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/browser"
import type { Personalisation, PersonalisationKey } from "@/types/configurator"

const LOGO_BUCKET = "design-logos"
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }
const LOGO_MAX_BYTES = 5 * 1024 * 1024

interface PersonaliseFieldsProps {
  value: Personalisation
  onChange: (key: PersonalisationKey, value: string) => void
  /** Where "Log in to add a logo" returns to. */
  returnTo: string
}

/** Rider name, race number and an optional logo. All free; the workshop places them on the proof. */
export function PersonaliseFields({ value, onChange, returnTo }: PersonaliseFieldsProps) {
  const nameId = useId()
  const numberId = useId()
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div className="space-y-1.5">
          <label htmlFor={nameId} className="text-sm font-semibold">
            Name on helmet <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id={nameId}
            value={value.riderName ?? ""}
            maxLength={24}
            onChange={(event) => onChange("riderName", event.target.value.replace(/^\s+/, ""))}
            placeholder="e.g. J. SMITH"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={numberId} className="text-sm font-semibold">
            Race number
          </label>
          <Input
            id={numberId}
            value={value.raceNumber ?? ""}
            maxLength={3}
            inputMode="text"
            onChange={(event) => onChange("raceNumber", event.target.value.replace(/[^0-9a-z]/gi, "").toUpperCase())}
            placeholder="29"
            autoComplete="off"
            className="text-center font-display text-lg font-bold"
          />
        </div>
      </div>
      <LogoUpload path={value.logo} onChange={(path) => onChange("logo", path)} returnTo={returnTo} />
    </div>
  )
}

function LogoUpload({ path, onChange, returnTo }: { path?: string; onChange: (path: string) => void; returnTo: string }) {
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
      .then(({ data }) => !cancelled && data && setPreviewUrl(data.signedUrl))
    return () => {
      cancelled = true
    }
  }, [path, previewUrl])

  async function upload(file: File | undefined) {
    if (!file || !userId) return
    const extension = LOGO_TYPES[file.type]
    if (!extension) return toast.error("Please choose a PNG, JPG or WebP image.")
    if (file.size > LOGO_MAX_BYTES) return toast.error("That logo is over 5 MB. Please choose a smaller file.")

    setUploading(true)
    try {
      const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`
      const { error } = await createClient().storage.from(LOGO_BUCKET).upload(objectPath, file, { contentType: file.type })
      if (error) throw error
      setPreviewUrl(URL.createObjectURL(file))
      onChange(objectPath)
    } catch {
      toast.error("Your logo didn't upload. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">
        Logo or sponsor <span className="font-normal text-muted-foreground">(optional)</span>
      </p>
      {path ? (
        <div className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-paper/60 p-2 pr-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-card ring-1 ring-carbon/10">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- private signed URL or local preview
              <img src={previewUrl} alt="Your logo" className="size-full object-contain" />
            ) : (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            )}
          </span>
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">We&apos;ll place it on your proof for you to approve.</p>
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
          to add your own logo.
        </p>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-carbon/20 px-4 py-3 text-sm transition-colors hover:border-carbon/40 focus-within:ring-3 focus-within:ring-ring/50"
        >
          {uploading ? <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden /> : <ImagePlus className="size-5 text-muted-foreground" aria-hidden />}
          <span>
            <span className="font-semibold">{uploading ? "Uploading…" : "Upload a logo"}</span>
            <span className="block text-xs text-muted-foreground">PNG with a transparent background works best. Up to 5 MB.</span>
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
