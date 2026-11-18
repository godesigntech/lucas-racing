import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/competition-terms"

export const metadata: Metadata = {
  title: "Competition Terms",
  description: "The full terms of the Lucas Racing and HydroKarts custom helmet competition.",
}

export default function CompetitionTermsPage() {
  return <LegalDocument document={document} intro="The full rules of the custom helmet competition." path="/competition/terms" />
}
