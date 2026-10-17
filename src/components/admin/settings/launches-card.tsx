"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ActiveSwitch } from "@/components/admin/active-switch"
import { AdminCard } from "@/components/admin/admin-card"
import { setKartPartsLive, setSectionVisible } from "@/lib/actions/admin/settings"

/** Sections that stay admin-only until the client signs them off. */
interface LaunchesCardProps {
  kartPartsLive: boolean
  showNews: boolean
  showGallery: boolean
}

function LaunchRow({ title, text, href, checked, label, onToggle }: { title: string; text: string; href: string; checked: boolean; label: string; onToggle: (next: boolean) => ReturnType<typeof setKartPartsLive> }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-carbon/10 pt-5 first:border-0 first:pt-0">
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
          Open the page <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ActiveSwitch checked={checked} label={label} onToggle={onToggle} />
    </div>
  )
}

export function LaunchesCard({ kartPartsLive, showNews, showGallery }: LaunchesCardProps) {
  return (
    <AdminCard title="Page launches" description="Switch sections on when they're ready. Admins can always preview MS Kart parts.">
      <div className="space-y-5">
        <LaunchRow
          title="News and results"
          text="Race reports and team news, plus the homepage section. Off: a coming-soon page."
          href="/news"
          checked={showNews}
          label="Show news and results"
          onToggle={(next) => setSectionVisible("news", next)}
        />
        <LaunchRow
          title="Gallery"
          text="Photo albums from race weekends. Off: a coming-soon page."
          href="/gallery"
          checked={showGallery}
          label="Show the gallery"
          onToggle={(next) => setSectionVisible("gallery", next)}
        />
        <LaunchRow
          title="MS Kart parts by HydroKarts"
          text="Customisable kart parts under Customisation. Keep this off until the client approves the MS Kart and HydroKarts branding; until then customers see a coming-soon page."
          href="/customisation/kart-parts"
          checked={kartPartsLive}
          label="Make MS Kart parts by HydroKarts public"
          onToggle={setKartPartsLive}
        />
      </div>
    </AdminCard>
  )
}
