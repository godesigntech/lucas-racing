"use client"

import { useEffect, useState } from "react"
import { ImageOff } from "lucide-react"

import { getChatImageUrl } from "@/lib/chat/attachments"
import { cn } from "@/lib/utils"

interface ChatImageProps {
  path: string | null
  /** Shown straight away for photos the viewer has just picked. */
  previewUrl?: string
  className?: string
}

/** A photo from a private chat bucket, opened full size in a new tab. */
export function ChatImage({ path, previewUrl, className }: ChatImageProps) {
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null)
  const [failedPath, setFailedPath] = useState<string | null>(null)

  useEffect(() => {
    if (!path || previewUrl) return
    let cancelled = false
    getChatImageUrl(path)
      .then((url) => !cancelled && setSigned({ path, url }))
      .catch(() => !cancelled && setFailedPath(path))
    return () => {
      cancelled = true
    }
  }, [path, previewUrl])

  const url = previewUrl ?? (signed?.path === path ? signed.url : undefined)
  const frame = cn("block overflow-hidden rounded-2xl bg-carbon/5", className)

  if (path && failedPath === path) {
    return (
      <span className={cn(frame, "flex aspect-[4/3] w-56 max-w-full items-center justify-center gap-2 text-xs text-muted-foreground")}>
        <ImageOff className="size-4" aria-hidden /> Photo unavailable
      </span>
    )
  }
  if (!url) return <span className={cn(frame, "aspect-[4/3] w-56 max-w-full animate-pulse")} aria-label="Loading photo" />

  return (
    <a href={url} target="_blank" rel="noreferrer" className={frame}>
      {/* Signed, short-lived URLs from a private bucket: not suitable for the image optimiser's cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Photo shared in the chat" className="max-h-64 w-full max-w-56 object-cover" />
    </a>
  )
}
