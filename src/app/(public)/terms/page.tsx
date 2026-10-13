import type { Metadata } from "next"

import { LegalPage } from "@/components/shared/legal-page"

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for custom helmet orders from Lucas Racing.",
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="The basics of how custom helmet orders work."
      sections={[
        {
          heading: "Designs and proofs",
          body: "Every custom helmet starts with a digital proof. Work begins only after you approve it.",
        },
        {
          heading: "Your own helmet",
          body: "If you send in a used helmet, we'll check its condition on arrival and contact you before starting if there's any concern.",
        },
        {
          heading: "Pricing",
          body: "Prices shown on this site are starting prices. Your final price is confirmed with the proof you approve.",
        },
      ]}
    />
  )
}
