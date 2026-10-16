"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"

const iconLink =
  "inline-flex h-10 items-center gap-2 rounded-full border border-carbon/15 bg-card px-4 text-sm font-semibold transition-colors hover:border-carbon/40"

/** Share on Facebook or X, or copy the link. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const encoded = encodeURIComponent(url)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the address bar still has the link.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">Share</span>
      <a className={iconLink} href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a
        className={iconLink}
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </a>
      <button type="button" onClick={copy} className={iconLink}>
        {copied ? <Check className="size-4 text-brand-ink" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  )
}
