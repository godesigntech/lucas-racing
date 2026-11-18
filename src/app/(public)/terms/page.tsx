import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/terms"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The terms for buying karts, parts, racewear, teamwear, custom helmets and stickers from Lucas Racing and HydroKarts.",
}

export default function TermsandConditionsPage() {
  return <LegalDocument document={document} intro="Who supplies your order, how payments and deposits work, and your rights." path="/terms" />
}
