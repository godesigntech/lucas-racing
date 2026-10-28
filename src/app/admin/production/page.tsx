import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { CapacityCalendar } from "@/components/admin/production/capacity-calendar"
import { ProductionSettingsForm } from "@/components/admin/production/production-settings-form"
import { RushTierForm } from "@/components/admin/production/rush-tier-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminProduction } from "@/lib/data/production"

export const metadata = { title: "Production" }

export default function AdminProductionPage() {
  return (
    <>
      <AdminPageHeader
        title="Production"
        description="When helmets can start in the workshop, how many at a time, and what a rush costs. Customers choose a start date at checkout; the completion date follows from it."
      />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Production />
      </Suspense>
    </>
  )
}

async function Production() {
  const { ready, settings, tiers, blackouts, weeks } = await getAdminProduction()
  if (!ready) return <MigrationNotice area="Production scheduling" />

  return (
    <div className="space-y-10">
      <ProductionSettingsForm settings={settings} tiers={tiers} />

      <section aria-labelledby="turnarounds-heading" className="space-y-4">
        <div>
          <h2 id="turnarounds-heading" className="font-display text-2xl font-bold uppercase">
            Turnarounds
          </h2>
          <p className="text-sm text-muted-foreground">
            The rush fees here are the client&apos;s provisional figures. They stay off until someone agrees them, and
            a turnaround with no fee can&apos;t be switched on.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {tiers.map((tier) => (
            <RushTierForm key={tier.key} tier={tier} rushEnabled={settings.rushEnabled} />
          ))}
        </div>
      </section>

      <section aria-labelledby="calendar-heading" className="space-y-4">
        <h2 id="calendar-heading" className="font-display text-2xl font-bold uppercase">
          Calendar
        </h2>
        <CapacityCalendar weeks={weeks} blackouts={blackouts} />
      </section>
    </div>
  )
}
