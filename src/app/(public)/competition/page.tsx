import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, Crown, PencilRuler, ScrollText, Send, Share2, Ticket, Trophy, Vote } from "lucide-react"

import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { competitionPrizes } from "@/lib/competition/prizes"
import { formatClosing, formatDay } from "@/lib/competition/status"
import { getCompetition, getCompetitionWinner } from "@/lib/data/competition"
import type { Competition, CompetitionWinner } from "@/types/competition"

export const metadata: Metadata = {
  title: "Win a custom Arai SK-6",
  description:
    "Design a helmet in the Lucas Racing design studio and you could win a brand-new Arai SK-6 finished in your design. Every other eligible entrant gets a discount voucher.",
}

const steps = [
  {
    icon: PencilRuler,
    title: "Design your helmet",
    text: "Build it in our design studio and include at least one hydrographic film. We can see which film you've chosen, so there's no need to tell us.",
  },
  {
    icon: Share2,
    title: "Share it",
    text: "Post your design on social media from your own account and tag both Lucas Racing and HydroKarts. Keep the post up until the winner is announced; stories that disappear don't count.",
  },
  {
    icon: Send,
    title: "Enter it",
    text: "On the Review step, press Enter the competition and paste the link to your post. One entry per person; you can change your design until entries close.",
  },
  {
    icon: Vote,
    title: "Vote",
    text: "Every eligible design goes on our Facebook page without names. Every entrant gets one vote, not for their own helmet. The most votes wins.",
  },
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

          <div className="rounded-3xl border border-carbon/10 bg-card p-6">
            <h2 className="font-display text-2xl font-bold uppercase">How to enter</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="mt-4 text-sm text-muted-foreground">
              Free to enter and open to anyone with a UK address. No purchase is necessary. Enter and vote under your own name with your own account.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <Trophy className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">Prizes</h2>
              <dl className="mt-3 divide-y divide-carbon/10 text-sm">
                {competitionPrizes.map((prize) => (
                  <div key={prize.place} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2">
                    <dt className="font-semibold">{prize.place}</dt>
                    <dd className={prize.percentOff ? "text-muted-foreground" : ""}>{prize.prize}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <CalendarDays className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">Key dates</h2>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Entries open</dt>
                <dd>{competition.opensAt ? formatClosing(competition.opensAt) : competition.status === "upcoming" ? "Coming soon" : "Now"}</dd>
                <dt className="text-muted-foreground">Entries close</dt>
                <dd>{competition.closesAt ? formatClosing(competition.closesAt) : "To be announced"}</dd>
                <dt className="text-muted-foreground">Voting on Facebook</dt>
                <dd>
                  {competition.votingOpensAt && competition.votingClosesAt
                    ? `${formatClosing(competition.votingOpensAt)} to ${formatClosing(competition.votingClosesAt)}`
                    : "To be announced"}
                </dd>
                <dt className="text-muted-foreground">Winner announced</dt>
                <dd>{competition.judgingDate ? formatDay(competition.judgingDate) : "To be announced"}</dd>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                If there&apos;s a tie for first place, Howard Lucas, Kat Franklin and Mark Mitchel choose the winner from the tied designs.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <Ticket className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">Using your voucher</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your voucher code is valid for 12 months from the date it&apos;s issued, and it&apos;s in your account under Competition. Enter it at
                checkout when you order your custom helmet and we&apos;ll book it in for its finish. The design studio shows the retail price as you
                build, and it updates as you choose options such as a spoiler, hydrographic film or chrome.
              </p>
            </div>
            <div className="rounded-3xl border border-carbon/10 bg-card p-6">
              <Crown className="size-6 text-brand-ink" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase">The winning helmet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll start work on the winning helmet in January 2027. The build takes around eight weeks, with delivery expected in early March
                2027. If the winning design includes chrome, allow three extra weeks, with delivery expected in late March 2027.
              </p>
            </div>
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
  // No "now" here: the page is prerendered, so it gives both dates rather than guessing which applies.
  const text =
    competition.status === "upcoming"
      ? competition.opensAt
        ? `Entries open ${formatClosing(competition.opensAt)}. Start your design now.`
        : "Entries open soon. Start your design now."
      : competition.status === "open"
        ? competition.opensAt && competition.closesAt
          ? `Entries open ${formatClosing(competition.opensAt)} and close ${formatClosing(competition.closesAt)}.`
          : competition.closesAt
            ? `Entries close ${formatClosing(competition.closesAt)}.`
            : "Entries are open."
        : competition.status === "closed"
          ? "Entries have closed. Vote for your favourite on our Facebook page."
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
