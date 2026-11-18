import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/complaints"

export const metadata: Metadata = {
  title: "Contact and Complaints",
  description: "How to contact Lucas Racing or HydroKarts about an order, and how complaints are handled.",
}

export default function ContactandComplaintsPage() {
  return <LegalDocument document={document} intro="Who to contact about an order, a problem or a complaint." path="/complaints" />
}
