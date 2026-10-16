import Link from "next/link"
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { getSiteSettings } from "@/lib/data/settings"

/** Closing contact band with the details from Admin > Settings. */
export async function HomeContact() {
  const settings = await getSiteSettings()
  const details = [
    settings.contactPhone && { icon: Phone, label: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/\s/g, "")}` },
    settings.contactEmail && { icon: Mail, label: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    settings.location && { icon: MapPin, label: settings.location, href: undefined },
  ].filter((detail): detail is { icon: typeof Phone; label: string; href: string | undefined } => Boolean(detail))

  return (
    <section className="pb-20 sm:pb-24">
      <Container>
        <div className="grid gap-8 rounded-[2rem] bg-brand p-8 text-carbon sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-4">
            <p className="eyebrow">Get in touch</p>
            <h2 className="display text-4xl sm:text-6xl">Talk to the team</h2>
            <p className="max-w-lg leading-relaxed">
              Karts, parts, racing support, a custom helmet or an existing order: send us a message and we&apos;ll get back to
              you.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">
                Send a message <ArrowRight />
              </Link>
            </Button>
          </div>
          {details.length > 0 && (
            <ul className="space-y-3">
              {details.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  {href ? (
                    <a href={href} className="flex items-center gap-3 rounded-2xl bg-carbon/10 px-5 py-4 font-semibold transition-colors hover:bg-carbon/15">
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className="break-all">{label}</span>
                    </a>
                  ) : (
                    <p className="flex items-center gap-3 rounded-2xl bg-carbon/10 px-5 py-4 font-semibold">
                      <Icon className="size-5 shrink-0" aria-hidden />
                      {label}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  )
}
