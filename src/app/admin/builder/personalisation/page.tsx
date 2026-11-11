import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Names, numbers & logos" }

export default function AdminBuilderPersonalisationPage() {
  return (
    <>
      <AdminPageHeader
        title="Steps 9–10 · Names, numbers & logos"
        description="Prices for the personal details customers add. Sponsor and team logos (step 10) are free to upload; check them on each order before production."
      />
      <Suspense fallback={<Skeleton className="h-[20rem] rounded-2xl" />}>
        <BuilderOptionGroups
          groups={[
            { key: "personalisation", title: "Personal details", description: "Names, numbers, initials, flags and custom text. \"Logo\" is the price of each sponsor or team logo." },
            {
              key: "coverage",
              title: "Dips and prints, by coverage",
              description: "The price of covering the whole helmet. A dip or print on part of it costs that share: a zone covering 30% costs 30%, an image covering 5% costs 5% of the print price.",
            },
          ]}
        />
      </Suspense>
    </>
  )
}
