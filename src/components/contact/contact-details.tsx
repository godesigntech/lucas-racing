import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react"

import { SocialLinks } from "@/components/shared/social-links"
import type { SiteSettings } from "@/types/settings"

interface DetailItem {
  icon: LucideIcon
  label: string
  value: string
  note?: string
  href?: string
}

export function ContactDetails({ settings }: { settings: SiteSettings }) {
  const items: DetailItem[] = [
    { icon: Mail, label: "Email", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    { icon: Phone, label: "Phone", value: settings.contactPhone },
    { icon: MapPin, label: "Workshop", value: settings.location, note: settings.addressNote },
    { icon: Clock, label: "Opening hours", value: settings.openingHours },
  ].filter((item) => item.value)

  return (
    <div className="space-y-6">
      <ul className="grid gap-3">
        {items.map(({ icon: Icon, label, value, note, href }) => (
          <li key={label} className="flex gap-4 rounded-2xl border border-carbon/10 bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-carbon text-brand">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-muted-foreground">{label}</p>
              {href ? (
                <a href={href} className="break-all font-semibold underline-offset-4 hover:underline">
                  {value}
                </a>
              ) : (
                <p className="font-semibold">{value}</p>
              )}
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-carbon p-5 text-paper">
        {settings.showEventBanner && settings.eventName ? (
          <>
            <p className="font-display text-2xl font-bold uppercase">Coming to {settings.eventName}?</p>
            <p className="mt-1 text-sm text-paper/70">
              Find the {settings.businessName} stand on {settings.eventDates}. Bring your helmet and we’ll talk designs.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl font-bold uppercase">Follow the team</p>
            <p className="mt-1 text-sm text-paper/70">Race days, new designs and finished helmets.</p>
          </>
        )}
        <SocialLinks links={settings.socialLinks} businessName={settings.businessName} className="mt-4" />
      </div>
    </div>
  )
}
