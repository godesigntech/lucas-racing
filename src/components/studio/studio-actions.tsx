"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, Link2, Loader2, MessageSquare } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { downloadPreviewImage } from "@/lib/studio/export-image"

interface StudioActionsProps {
  shareUrl: string
  enquiryHref: string
  imageName: string
  imageCaption: string
  getPreviewSvg: () => SVGSVGElement | null
  imageUnavailableReason?: string
}

/** Header actions: copy a share link, download a watermarked image, ask the workshop. */
export function StudioActions({ shareUrl, enquiryHref, imageName, imageCaption, getPreviewSvg, imageUnavailableReason }: StudioActionsProps) {
  const [downloading, setDownloading] = useState(false)

  async function copyLink() {
    const url = new URL(shareUrl, window.location.origin).toString()
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied. Anyone with it can open this build.")
    } catch {
      window.prompt("Copy this link to share your build:", url)
    }
  }

  async function downloadImage() {
    if (imageUnavailableReason) return
    const svg = getPreviewSvg()
    if (!svg) return
    setDownloading(true)
    try {
      await downloadPreviewImage(svg, imageName, imageCaption)
      toast.success("Image downloaded. Share it with the #LucasRacing tag.")
    } catch {
      toast.error("We couldn't create the image. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" onClick={copyLink}>
        <Link2 /> Share link
      </Button>
      <Button variant="ghost" size="sm" onClick={downloadImage} disabled={downloading || Boolean(imageUnavailableReason)}>
        {downloading ? <Loader2 className="animate-spin" aria-hidden /> : <Download />} Social image
      </Button>
      {imageUnavailableReason && <p className="order-last w-full text-xs text-muted-foreground">{imageUnavailableReason}</p>}
      <Button asChild variant="ghost" size="sm">
        <Link href={enquiryHref}>
          <MessageSquare /> Ask the workshop
        </Link>
      </Button>
    </div>
  )
}
