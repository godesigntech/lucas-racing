import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, ScrollText, Trophy } from "lucide-react"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Win a custom Arai SK-6",
  description: "Design the best helmet on our website and win a brand new Arai SK-6, customised by HydroKarts to your design.",
}

// The client is supplying the rules and dates; until then the page says they're coming.
const drawDate: string | null = null
const rules: string[] = []

/** The helmet competition, with a short address for the QR code: /competition. */
export default function CompetitionPage() {
  return (
    <>
      <PageHero
        eyebrow="Competition"
        title="Win a custom Arai SK-6"
        description="We're giving away a brand new white Arai SK-6. Design the best helmet using our website and we'll make it for you."
      >
        <Button asChild size="lg" className="mt-6">
          <Link href="/helmet-builder">Start designing</Link>
        </Button>
      </PageHero>
      <section className="py-12 sm:py-16">
        <Container className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-carbon/10 bg-card p-6">
            <Trophy className="size-6 text-brand-ink" aria-hidden />
            <h2 className="mt-3 font-display text-2xl font-bold uppercase">The prize</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A brand new white Arai SK-6, customised by HydroKarts to the winning design.
            </p>
          </div>
          <div className="rounded-3xl border border-carbon/10 bg-card p-6">
            <CalendarDays className="size-6 text-brand-ink" aria-hidden />
            <h2 className="mt-3 font-display text-2xl font-bold uppercase">Draw date</h2>
            <p className="mt-1 text-sm text-muted-foreground">{drawDate ?? "To be announced soon."}</p>
          </div>
          <div className="rounded-3xl border border-carbon/10 bg-card p-6">
            <ScrollText className="size-6 text-brand-ink" aria-hidden />
            <h2 className="mt-3 font-display text-2xl font-bold uppercase">How to enter</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Design your helmet in our builder and save it to your account. Full entry details come with the rules.
            </p>
          </div>
          <div className="rounded-3xl border border-carbon/10 bg-card p-6 lg:col-span-3">
            <h2 className="font-display text-2xl font-bold uppercase">Rules</h2>
            {rules.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">The full competition rules will be published here soon.</p>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}
