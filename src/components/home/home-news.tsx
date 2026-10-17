import Link from "next/link"
import { ArrowRight, Flag, Newspaper, Trophy } from "lucide-react"

import { Container } from "@/components/layout/container"
import { NewsCard } from "@/components/news/news-card"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { getLatestNews } from "@/lib/data/news"
import { getSiteSettings } from "@/lib/data/settings"

const comingUp = [
  { icon: Flag, title: "Race reports", text: "How every weekend went for our drivers." },
  { icon: Trophy, title: "Results", text: "Podiums, points and championship standings." },
  { icon: Newspaper, title: "Team news", text: "New drivers, test days, events and MS Kart updates." },
]

/** The latest three posts, or what's coming until the first one is published. */
export async function HomeNews() {
  const [posts, settings] = await Promise.all([getLatestNews(3), getSiteSettings()])
  if (!settings.showNews) return null

  return (
    <section className="pb-20 sm:pb-24" aria-labelledby="home-news">
      <Container className="space-y-10">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="News and results"
            title={<span id="home-news">Latest from the paddock</span>}
            description="Race reports, results and team news from Lucas Racing."
          />
          <Button asChild variant="outline" className="self-start lg:self-auto">
            <Link href="/news">
              All news <ArrowRight />
            </Link>
          </Button>
        </div>
        {posts.length > 0 ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="reveal">
                <NewsCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-5 md:grid-cols-3">
            {comingUp.map(({ icon: Icon, title, text }) => (
              <li key={title} className="reveal rounded-3xl border border-dashed border-carbon/20 bg-card p-6">
                <span className="grid size-11 place-items-center rounded-full bg-accent text-brand-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 font-display text-2xl font-bold uppercase">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">Coming soon</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
