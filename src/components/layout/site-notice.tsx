import { Info } from "lucide-react"

import { getSiteSettings } from "@/lib/data/settings"

/** The notice across the top of every page (Admin > Settings > Launches), while it's on. */
export async function SiteNotice() {
  const settings = await getSiteSettings()
  if (!settings.showSiteNotice || !settings.siteNotice.trim()) return null

  return (
    <div role="note" className="bg-brand px-4 py-2 text-center text-xs font-medium leading-snug text-carbon sm:text-sm">
      <p className="mx-auto flex max-w-5xl items-start justify-center gap-2 text-balance">
        <Info className="mt-px size-4 shrink-0" aria-hidden />
        <span>{settings.siteNotice}</span>
      </p>
    </div>
  )
}
