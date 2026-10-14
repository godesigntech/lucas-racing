import { Suspense } from "react"
import type { Metadata } from "next"

import { ContactDetails } from "@/components/contact/contact-details"
import { ContactForm } from "@/components/forms/contact-form"
import { ContactFormFromUrl } from "@/components/forms/contact-form-from-url"
import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"
import { getProducts } from "@/lib/data/products"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Lucas Racing and Hydro Karts workshop about a custom helmet, an order or sending in your own helmet.",
}

export default async function ContactPage() {
  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()])
  const designs = products.map(({ slug, name }) => ({ slug, name }))

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the workshop"
        description="Questions about a design, sending in your own helmet or an existing order? Send us a message and the team will get back to you."
        image={images.workshop}
      />
      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
          <ContactDetails settings={settings} />
          <div className="rounded-3xl border border-carbon/10 bg-card p-6 sm:p-8">
            <h2 className="font-display text-3xl font-bold uppercase">Send a message</h2>
            <p className="mt-1 mb-7 text-sm text-muted-foreground">
              Preview: the form checks your details, but messages aren’t delivered yet. Email us directly for anything
              urgent.
            </p>
            <Suspense fallback={<ContactForm designs={designs} />}>
              <ContactFormFromUrl designs={designs} />
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  )
}
