import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react"

import { SocialIcon } from "@/components/shared/social-icon"
import { siteConfig } from "@/config/site"

interface DetailItem {
  icon: LucideIcon
  label: string
  value: string
  note?: string
  href?: string
}

export function ContactDetails() {
  const { contact } = siteConfig
  const items: DetailItem[] = [
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { icon: Phone, label: "Phone", value: contact.phone, note: "Placeholder number" },
    { icon: MapPin, label: "Workshop", value: contact.location, note: contact.addressNote },
    { icon: Clock, label: "Opening hours", value: contact.hours },
  ]

  return (
    <div className="space-y-6">
      <ul className="grid gap-3">
        {items.map(({ icon: Icon, label, value, note, href }) => (
          <li key={label} className="flex gap-4 rounded-2xl border border-carbon/10 bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-carbon text-lime">
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
        <p className="font-display text-2xl font-bold uppercase">Coming to {siteConfig.event.name}?</p>
        <p className="mt-1 text-sm text-paper/70">
          Find the Lucas Racing stand on {siteConfig.event.dates}. Bring your helmet and we’ll talk designs.
        </p>
        <ul className="mt-4 flex gap-2" aria-label="Social media">
          {siteConfig.social.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${siteConfig.name} on ${item.label}`}
                className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-lime hover:text-lime"
              >
                <SocialIcon name={item.icon} className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
