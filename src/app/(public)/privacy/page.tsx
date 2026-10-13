import type { Metadata } from "next"

import { LegalPage } from "@/components/shared/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lucas Racing collects and uses personal information.",
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How we handle the details you share with us."
      sections={[
        {
          heading: "What we collect",
          body: "Details you give us through forms and accounts: your name, email, phone number, helmet designs and any files you upload.",
        },
        {
          heading: "How we use it",
          body: "To reply to enquiries, produce and deliver your helmet, and manage your account. We don't sell your information.",
        },
        {
          heading: "Your rights",
          body: "You can ask to see, correct or delete the information we hold about you by contacting the team.",
        },
      ]}
    />
  )
}
