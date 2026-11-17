"use client"

import { useEffect, useRef, useState } from "react"

import { SocialIcon } from "@/components/shared/social-icon"

/** The WhatsApp button when each team has its own number: it asks which team first. */
export function WhatsAppChooser({ links }: { links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", close)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", close)
    }
  }, [open])

  return (
    <div ref={root} data-floating-launcher data-whatsapp className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <ul className="w-60 overflow-hidden rounded-2xl bg-card shadow-[0_12px_32px_-8px_rgb(17_20_18/0.45)] ring-1 ring-carbon/10" aria-label="Choose a team">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-carbon/[0.04]">
                <SocialIcon name="whatsapp" className="size-5 shrink-0 text-[#25d366]" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Chat with us on WhatsApp"
        className="flex h-14 items-center gap-2 rounded-full bg-[#25d366] pl-4 pr-4 font-semibold text-white shadow-[0_12px_32px_-8px_rgb(17_20_18/0.6)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25d366]/50 active:scale-95 sm:pr-5"
      >
        <SocialIcon name="whatsapp" className="size-7" />
        <span className="max-sm:sr-only">WhatsApp us</span>
      </button>
    </div>
  )
}
