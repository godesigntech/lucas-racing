"use client"

import { useSearchParams } from "next/navigation"

import { ContactForm, type DesignOption } from "./contact-form"

/** Pre-fills the contact form from `?design=` and `?build=` links (e.g. from the configurator). */
export function ContactFormFromUrl({ designs }: { designs: DesignOption[] }) {
  const searchParams = useSearchParams()
  const design = searchParams.get("design") ?? undefined
  const build = searchParams.get("build")
  const message = build ? `Hi, I'd like a quote for this build:\n\n${build}\n\n` : undefined

  return <ContactForm key={`${design}-${build}`} designs={designs} initialDesign={design} initialMessage={message} />
}
