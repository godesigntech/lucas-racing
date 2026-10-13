import Link from "next/link"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { SocialIcon } from "@/components/shared/social-icon"
import { siteConfig } from "@/config/site"
import { legalNav, mainNav } from "@/constants/navigation"
import { getProducts } from "@/lib/data/products"

import { Container } from "./container"
import { Wordmark } from "./wordmark"

const linkClass = "text-sm text-paper/70 transition-colors hover:text-lime"

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="eyebrow mb-4 text-paper/45">{children}</h2>
}

export async function SiteFooter() {
  const products = (await getProducts()).slice(0, 5)
  const { contact } = siteConfig

  return (
    <footer className="grid-texture mt-auto bg-carbon text-paper">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-5">
          <Wordmark tone="light" />
          <p className="max-w-xs text-sm leading-relaxed text-paper/65">
            Custom race helmets from the Lucas Racing team. Designed with you and hydro-dipped by Hydro Karts in our UK workshop.
          </p>
          <ul className="flex gap-2" aria-label="Social media">
            {siteConfig.social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${siteConfig.name} on ${item.label}`}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-paper/80 transition-colors hover:border-lime hover:text-lime"
                >
                  <SocialIcon name={item.icon} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <FooterHeading>Explore</FooterHeading>
          <ul className="space-y-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <FooterHeading>Helmet designs</FooterHeading>
          <ul className="space-y-3">
            {products.map((product) => (
              <li key={product.slug}>
                <Link href={`/products/${product.slug}`} className={linkClass}>
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Get in touch</FooterHeading>
          <ul className="space-y-3 text-sm text-paper/70">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
              <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-lime">
                {contact.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
              <span>{contact.phone}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
              <span>
                {contact.location}
                <span className="block text-paper/45">{contact.addressNote}</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
              <span>{contact.hours}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-lime">
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
