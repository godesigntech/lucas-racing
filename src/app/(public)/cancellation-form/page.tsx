import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import { PrintButton } from "@/components/shared/print-button"
import document from "@/content/legal/cancellation-form"

export const metadata: Metadata = {
  title: "Cancellation Form",
  description: "An optional form to cancel an order with Lucas Racing or HydroKarts.",
}

export default function CancellationFormPage() {
  return (
    <LegalDocument document={document} intro="Optional: use this form, or any clear message, to cancel an order." path="/cancellation-form">
      <PrintButton label="Print or save this form" />
    </LegalDocument>
  )
}
