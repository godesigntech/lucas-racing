"use client"

import { useSearchParams } from "next/navigation"

import { ContactForm, type DesignOption } from "./contact-form"

/** Pre-fills the contact form from `?design=`, `?build=` (the configurator) and `?message=` links. */
export function ContactFormFromUrl({ designs }: { designs: DesignOption[] }) {
  const searchParams = useSearchParams()
  const design = searchParams.get("design") ?? undefined
  const build = searchParams.get("build")
  const text = searchParams.get("message")
  const message = build ? `Hi, I'd like a quote for this build:\n\n${build}\n\n` : (text ?? undefined)

  return <ContactForm key={`${design}-${build}-${text}`} designs={designs} initialDesign={design} initialMessage={message} />
}
