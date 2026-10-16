import Link from "next/link"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { SocialLinks } from "@/components/shared/social-links"
import { siteConfig } from "@/config/site"
import { footerNav, legalNav } from "@/constants/navigation"
import { getSiteSettings } from "@/lib/data/settings"

import { Container } from "./container"
import { Logo } from "./logo"

const linkClass = "text-sm text-paper/70 transition-colors hover:text-brand"

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-4 text-paper/45">{children}</h2>
}

export async function SiteFooter() {
  const settings = await getSiteSettings()

  return (
    <footer className="grid-texture mt-auto bg-carbon text-paper">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_1.2fr]">
        <div className="space-y-5">
          <Logo tone="light" />
          <p className="max-w-xs text-sm leading-relaxed text-paper/65">
            A family-run kart racing team and the UK home of MS Kart. Karts, parts, racing support, custom helmets by
            HydroKarts, racewear and teamwear.
          </p>
          <SocialLinks links={settings.socialLinks} businessName={settings.businessName} />
        </div>

        {footerNav.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <FooterHeading>{column.title}</FooterHeading>
            <ul className="space-y-3">
              {column.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <FooterHeading>Get in touch</FooterHeading>
          <ul className="space-y-3 text-sm text-paper/70">
            {settings.contactEmail && (
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <a href={`mailto:${settings.contactEmail}`} className="break-all transition-colors hover:text-brand">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{settings.contactPhone}</span>
              </li>
            )}
            {settings.location && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>
                  {settings.location}
                  {settings.addressNote && <span className="block text-paper/45">{settings.addressNote}</span>}
                </span>
              </li>
            )}
            {settings.openingHours && (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{settings.openingHours}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.copyrightYear} {settings.businessName}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  )
}
