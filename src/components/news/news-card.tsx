import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Newspaper } from "lucide-react"

import { formatDate } from "@/lib/format"
import { summaryOf } from "@/lib/news/text"
import { cn } from "@/lib/utils"
import type { NewsPost } from "@/types/news"

interface NewsCardProps {
  post: NewsPost
  /** The lead story: larger photo and heading. */
  lead?: boolean
  /** Use a dark card (for dark sections). */
  tone?: "light" | "dark"
  className?: string
  /** Preload the photo when the card is above the fold. */
  preload?: boolean
}

/** A post in a grid: photo, category, date, title and summary. The whole card is a link. */
export function NewsCard({ post, lead, tone = "light", className, preload }: NewsCardProps) {
  const dark = tone === "dark"
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.5)] focus-within:ring-3 focus-within:ring-ring/40",
        dark ? "border-white/10 bg-white/5 text-paper" : "border-carbon/10 bg-card",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-carbon", lead ? "aspect-[16/10] lg:aspect-auto lg:min-h-[22rem] lg:flex-1" : "aspect-[16/10]")}>
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={post.coverAlt}
            fill
            preload={preload}
            sizes={lead ? "(min-width: 1024px) 64vw, 100vw" : "(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid-texture grid size-full place-items-center text-paper/30">
            <Newspaper className="size-12" aria-hidden />
          </div>
        )}
        {post.category && (
          <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-carbon">{post.category.name}</span>
        )}
      </div>
      <div className={cn("flex flex-col gap-3", lead ? "p-6 sm:p-8" : "flex-1 p-5 sm:p-6")}>
        <p className={cn("font-mono text-xs uppercase tracking-[0.14em]", dark ? "text-paper/55" : "text-muted-foreground")}>
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          <span aria-hidden> · </span>
          {post.readingMinutes} min read
        </p>
        <h3 className={cn("font-display font-bold uppercase leading-[1.05]", lead ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl")}>
          <Link href={`/news/${post.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h3>
        <p className={cn("line-clamp-3 leading-relaxed", dark ? "text-paper/70" : "text-muted-foreground", lead && "sm:text-lg")}>
          {summaryOf(post.excerpt, post.body)}
        </p>
        <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold", dark ? "text-brand" : "text-brand-ink")}>
          Read more
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  )
}
