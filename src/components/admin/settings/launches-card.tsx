"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { ActiveSwitch } from "@/components/admin/active-switch"
import { AdminCard } from "@/components/admin/admin-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { setKartPartsLive, setSectionVisible, updateSiteNotice } from "@/lib/actions/admin/settings"

/** Sections that stay admin-only until the client signs them off. */
interface LaunchesCardProps {
  kartPartsLive: boolean
  showNews: boolean
  showGallery: boolean
  siteNotice: string
  showSiteNotice: boolean
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

/** The notice across the top of every page: its words and an on/off switch. */
function SiteNoticeRow({ notice, show }: { notice: string; show: boolean }) {
  const [text, setText] = useState(notice)
  const [on, setOn] = useState(show)
  const [saving, startSaving] = useTransition()

  function save(nextOn: boolean) {
    startSaving(async () => {
      const result = await updateSiteNotice(text, nextOn)
      if (result.ok) {
        setOn(nextOn)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">Notice on every page</p>
          <p className="text-sm text-muted-foreground">A strip across the top of the website, for news like &ldquo;still in testing&rdquo;.</p>
        </div>
        <Switch checked={on} disabled={saving} onCheckedChange={save} aria-label="Show the notice on every page" />
      </div>
      <Textarea value={text} maxLength={400} rows={3} onChange={(event) => setText(event.target.value)} aria-label="Notice text" />
      <Button type="button" size="sm" variant="outline" disabled={saving || text.trim() === notice.trim()} onClick={() => save(on)}>
        {saving && <Loader2 className="animate-spin" aria-hidden />}
        Save notice
      </Button>
    </div>
  )
}

export function LaunchesCard({ kartPartsLive, showNews, showGallery, siteNotice, showSiteNotice }: LaunchesCardProps) {
  return (
    <AdminCard title="Page launches" description="Switch sections on when they're ready. Admins can always preview MS Kart parts.">
      <div className="space-y-5">
        <SiteNoticeRow notice={siteNotice} show={showSiteNotice} />
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
