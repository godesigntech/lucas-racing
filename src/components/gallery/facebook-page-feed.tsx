"use client"

import { useEffect, useRef, useState } from "react"

/** Facebook's page box only takes widths from 180 to 500 pixels. */
const MIN_WIDTH = 180
const MAX_WIDTH = 500
const HEIGHT = 720

/**
 * A public Facebook page's latest posts and photos, through Facebook's own page box.
 * No login or access needed. Sized to its column once on screen (the box doesn't
 * resize itself after it loads).
 */
export function FacebookPageFeed({ pageUrl, name }: { pageUrl: string; name: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const element = box.current
    if (!element) return
    const measure = () => setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(element.clientWidth))))
    // Measures straight away on observe, and again whenever the column changes size.
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const params = new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: String(width ?? MAX_WIDTH),
    height: String(HEIGHT),
    small_header: "false",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "false",
  })

  return (
    <div ref={box} className="mx-auto w-full max-w-[500px]" style={{ height: HEIGHT }}>
      {width !== null && (
        <iframe
          key={width}
          title={`${name} on Facebook`}
          src={`https://www.facebook.com/plugins/page.php?${params}`}
          width={width}
          height={HEIGHT}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; web-share"
          className="mx-auto block rounded-2xl border-0 bg-card"
        />
      )}
    </div>
  )
}
