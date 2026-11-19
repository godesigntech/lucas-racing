import { getSiteSettings } from "@/lib/data/settings"

/** The notice across the top of every page (Admin > Settings > Launches), while it's on. */
export async function SiteNotice() {
  const settings = await getSiteSettings()
  if (!settings.showSiteNotice || !settings.siteNotice.trim()) return null

  return (
    <div role="note" className="bg-brand px-4 py-2 text-center text-xs font-medium leading-snug text-carbon sm:text-sm">
      <p className="mx-auto max-w-5xl text-balance">{settings.siteNotice}</p>
    </div>
  )
}
