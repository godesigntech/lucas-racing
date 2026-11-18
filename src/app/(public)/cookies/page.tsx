import type { Metadata } from "next"

import { CookieChoices } from "@/components/shared/cookie-choices"
import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/cookies"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies and similar technologies used on lucasracing.co.uk, and how to control them.",
}

export default function CookiePolicyPage() {
  return (
    <LegalDocument document={document} intro="What this website stores on your device, and your choices." path="/cookies">
      <CookieChoices />
    </LegalDocument>
  )
}
