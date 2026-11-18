import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/privacy"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lucas Racing and HydroKarts use your personal information.",
}

export default function PrivacyPolicyPage() {
  return <LegalDocument document={document} intro="How Lucas Racing and HydroKarts use and protect your information." path="/privacy" />
}
