import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Crown, PencilRuler, ScrollText, Send, Trophy } from "lucide-react"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { formatClosing, formatDay } from "@/lib/competition/status"
import { getCompetition, getCompetitionWinner } from "@/lib/data/competition"
import type { Competition, CompetitionWinner } from "@/types/competition"

export const metadata: Metadata = {
  title: "Win a custom Arai SK-6",
  description: "Design the best helmet on our website and win a brand new Arai SK-6, customised by HydroKarts to your design.",
}

const steps = [
  { icon: PencilRuler, title: "Design your helmet", text: "Use our 3D helmet builder: pick a template, your colours, films, name and number." },
  { icon: Send, title: "Enter it", text: "On the last step, press Enter the competition. You can change your design until entries close." },
  { icon: Crown, title: "Win it", text: "Our team picks the best design, and we make it for real on a brand new helmet." },
]

/** The helmet competition, with a short address for the QR code: /competition. Set up in Admin › Competition. */
export default async function CompetitionPage() {
  const competition = await getCompetition()
  const winner = competition?.status === "judged" ? await getCompetitionWinner(competition.id) : null

  if (!competition) {
    return <PageHero eyebrow="Competition" title="Helmet competition" description="Our next competition is coming soon. Check back shortly." />
  }

  return (
    <>
      <PageHero eyebrow="Competition" title={competition.title} description={competition.description || competition.prize}>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/helmet-builder?competition=1">{competition.status === "open" ? "Design your entry" : "Start designing"}</Link>
          </Button>
          <StatusNote competition={competition} />
        </div>
      </PageHero>

      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          {winner && <WinnerCard winner={winner} />}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <Trophy className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">The prize</h2>
              <p className="mt-1 text-sm text-muted-foreground">{competition.prize || "To be announced soon."}</p>
            </div>
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <CalendarDays className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">Key dates</h2>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Entries open</dt>
                <dd>{competition.opensAt ? formatClosing(competition.opensAt) : competition.status === "upcoming" ? "Coming soon" : "Now"}</dd>
                <dt className="text-muted-foreground">Entries close</dt>
                <dd>{competition.closesAt ? formatClosing(competition.closesAt) : "To be announced"}</dd>
                <dt className="text-muted-foreground">Winner announced</dt>
                <dd>{competition.judgingDate ? formatDay(competition.judgingDate) : "To be announced"}</dd>
              </dl>
            </div>
          </div>

          <div className="rounded-3xl border border-carbon/10 bg-card p-6">
            <h2 className="font-display text-2xl font-bold uppercase">How to enter</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="rounded-2xl bg-paper/70 p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-brand-ink">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">Step {index + 1}</p>
                  <h3 className="font-display text-xl font-bold uppercase leading-tight">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">Free to enter, one entry per person. You&apos;ll need a free account so we can contact the winner.</p>
          </div>

          <div id="rules" className="scroll-mt-28 rounded-3xl border border-carbon/10 bg-card p-6">
            <ScrollText className="size-6 text-brand-ink" aria-hidden />
            <h2 className="mt-3 font-display text-2xl font-bold uppercase">Rules</h2>
            {competition.rules.length > 0 ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                {competition.rules.map((rule) => (
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

function StatusNote({ competition }: { competition: Competition }) {
  const text =
    competition.status === "upcoming"
      ? "Entries open soon. Start your design now."
      : competition.status === "open"
        ? competition.closesAt
          ? `Entries close ${formatClosing(competition.closesAt)}.`
          : "Entries are open."
        : competition.status === "closed"
          ? "Entries have closed. We're judging now."
          : "The winner has been announced."
  return <p className="text-sm text-paper/75">{text}</p>
}

function WinnerCard({ winner }: { winner: CompetitionWinner }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-carbon p-6 text-paper sm:flex-row sm:items-center">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-carbon">
        <Crown className="size-7" aria-hidden />
      </span>
      <div>
        <p className="eyebrow text-paper/60">The winner</p>
        <h2 className="font-display text-3xl font-bold uppercase leading-none">{winner.firstName}</h2>
        <p className="mt-1 text-sm text-paper/75">With the design &ldquo;{winner.designName}&rdquo;. Congratulations, and thank you to everyone who entered!</p>
      </div>
    </div>
  )
}
