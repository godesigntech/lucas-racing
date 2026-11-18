import Link from "next/link"

import { NewsMarkdown } from "@/components/news/news-markdown"
import { PageHero } from "@/components/shared/page-hero"
import { legalDetails, type LegalDetailKey } from "@/lib/legal/details"

export interface LegalDocumentContent {
  title: string
  body: string
}

/** The website's policy pages, linked from each other and the footer. */
export const legalPages = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Delivery, Returns and Cancellations", href: "/delivery-returns" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Contact and Complaints", href: "/complaints" },
  { label: "Cancellation Form", href: "/cancellation-form" },
  { label: "Competition Terms", href: "/competition/terms" },
] as const

/** The document's text with its {{fields}} filled, and whether any are still stand-ins. */
export function fillLegalDocument(body: string): { text: string; provisional: boolean } {
  let provisional = false
  const text = body.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const detail = legalDetails[key as LegalDetailKey]
    if (!detail) return match
    if (!detail.confirmed) provisional = true
    return detail.value
  })
  return { text, provisional }
}

/**
 * A policy page from the client's legal documents (src/content/legal). Details still
 * being confirmed (src/lib/legal/details.ts) are filled with stand-ins and the page says so.
 */
export function LegalDocument({
  document,
  intro,
  path,
  children,
}: {
  document: LegalDocumentContent
  intro: string
  /** This page's address, left out of the "related" links. */
  path: string
  /** Extra content after the document, such as the cookie settings. */
  children?: React.ReactNode
}) {
  const { text, provisional } = fillLegalDocument(document.body)
  return (
    <>
      <PageHero eyebrow="Legal" title={document.title} description={intro} />
      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:px-8">
          <div className="min-w-0 space-y-8">
            {provisional && (
              <p role="note" className="rounded-2xl border border-dashed border-carbon/25 bg-card p-4 text-sm text-muted-foreground">
                Some details on this page, such as company registration details, are still being confirmed and will be updated shortly.
              </p>
            )}
            <NewsMarkdown>{text}</NewsMarkdown>
            {children}
          </div>
          <nav aria-label="Policies" className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow text-muted-foreground">Policies</p>
            <ul className="mt-3 space-y-2 text-sm">
              {legalPages.map((page) => (
                <li key={page.href}>
                  {page.href === path ? (
                    <span aria-current="page" className="font-semibold text-carbon">
                      {page.label}
                    </span>
                  ) : (
                    <Link href={page.href} className="text-muted-foreground underline-offset-4 hover:text-carbon hover:underline">
                      {page.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  )
}

