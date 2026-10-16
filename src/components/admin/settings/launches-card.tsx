"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ActiveSwitch } from "@/components/admin/active-switch"
import { AdminCard } from "@/components/admin/admin-card"
import { setKartPartsLive } from "@/lib/actions/admin/settings"

/** Sections that stay admin-only until the client signs them off. */
export function LaunchesCard({ kartPartsLive }: { kartPartsLive: boolean }) {
  return (
    <AdminCard title="Page launches" description="Sections waiting on the client's approval. Admins can always preview them.">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">MS Kart parts by HydroKarts</p>
          <p className="text-sm text-muted-foreground">
            Customisable kart parts under Customisation. Keep this off until the client approves the MS Kart and HydroKarts
            branding; until then customers see a &ldquo;coming soon&rdquo; page.
          </p>
          <Link href="/customisation/kart-parts" className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            Preview the page <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <ActiveSwitch checked={kartPartsLive} label="Make MS Kart parts by HydroKarts public" onToggle={setKartPartsLive} />
      </div>
    </AdminCard>
  )
}
