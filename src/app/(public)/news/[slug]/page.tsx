import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"

import { Container } from "@/components/layout/container"
import { JsonLd } from "@/components/news/json-ld"
import { NewsCard } from "@/components/news/news-card"
import { NewsMarkdown } from "@/components/news/news-markdown"
import { ShareLinks } from "@/components/news/share-links"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"
import { brandLogos } from "@/constants/brand"
import { getNewsPost, getRelatedNews } from "@/lib/data/news"
import { formatDate } from "@/lib/format"
import { summaryOf } from "@/lib/news/text"
import { cn } from "@/lib/utils"
import type { NewsPost } from "@/types/news"

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const post = await getNewsPost((await params).slug)
  if (!post) return { title: "Post not found" }
  const description = post.seoDescription || summaryOf(post.excerpt, post.body, 155)
  const url = `/news/${post.slug}`
  return {
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.seoTitle || post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      section: post.category?.name,
      images: post.coverUrl ? [{ url: post.coverUrl, alt: post.coverAlt || post.title }] : undefined,
    },
    twitter: { card: post.coverUrl ? "summary_large_image" : "summary", title: post.seoTitle || post.title, description },
  }
}

export default function NewsPostPage({ params }: PageProps<"/news/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      {params.then(({ slug }) => (
        <Post slug={slug} />
      ))}
    </Suspense>
  )
}

async function Post({ slug }: { slug: string }) {
  const post = await getNewsPost(slug)
  if (!post) notFound()
  const url = new URL(`/news/${post.slug}`, siteConfig.url).toString()

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: post.title,
          description: post.seoDescription || summaryOf(post.excerpt, post.body, 155),
          image: post.coverUrl ? [new URL(post.coverUrl, siteConfig.url).toString()] : undefined,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: { "@type": "Organization", name: post.authorName, url: siteConfig.url },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            logo: { "@type": "ImageObject", url: new URL(brandLogos.lucasRacing.src, siteConfig.url).toString() },
          },
          mainEntityOfPage: url,
          articleSection: post.category?.name,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "News", item: new URL("/news", siteConfig.url).toString() },
            ...(post.category
              ? [{ "@type": "ListItem", position: 3, name: post.category.name, item: new URL(`/news/category/${post.category.slug}`, siteConfig.url).toString() }]
              : []),
            { "@type": "ListItem", position: post.category ? 4 : 3, name: post.title, item: url },
          ],
        }}
      />

      <header className="grid-texture relative isolate overflow-hidden bg-carbon text-paper">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
        <Container className={cn("max-w-4xl space-y-6 py-12 sm:py-16", post.coverUrl && "pb-28 sm:pb-36")}>
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-paper/70 transition-colors hover:text-paper">
            <ArrowLeft className="size-4" aria-hidden /> All news
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-paper/60">
            {post.category && (
              <Link href={`/news/category/${post.category.slug}`} className="rounded-full bg-brand px-3 py-1 font-sans text-xs font-semibold normal-case tracking-normal text-carbon">
                {post.category.name}
              </Link>
            )}
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {post.readingMinutes} min read
            </span>
          </div>
          <h1 className="display text-4xl sm:text-6xl">{post.title}</h1>
          {post.excerpt && <p className="max-w-3xl text-lg leading-relaxed text-paper/75 sm:text-xl">{post.excerpt}</p>}
          <p className="text-sm text-paper/60">By {post.authorName}</p>
        </Container>
      </header>

      <Container className="max-w-4xl py-10 sm:py-14">
        {post.coverUrl && (
          <figure className="-mt-20 mb-10 overflow-hidden rounded-[2rem] bg-carbon shadow-[0_30px_60px_-30px_rgb(17_20_18/0.5)] sm:-mt-24">
            <div className="relative aspect-[16/9]">
              <Image src={post.coverUrl} alt={post.coverAlt || post.title} fill preload sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
            </div>
          </figure>
        )}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "News", href: "/news" },
            ...(post.category ? [{ label: post.category.name, href: `/news/category/${post.category.slug}` }] : []),
            { label: post.title },
          ]}
        />
        <NewsMarkdown className="mt-8">{post.body}</NewsMarkdown>
        <div className="mt-12 flex flex-col gap-4 border-t border-carbon/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Published {post.publishedAt ? formatDate(post.publishedAt) : ""} by {post.authorName}
          </p>
          <ShareLinks url={url} title={post.title} />
        </div>
      </Container>

      <Suspense fallback={null}>
        <RelatedPosts post={post} />
      </Suspense>
    </article>
  )
}

async function RelatedPosts({ post }: { post: NewsPost }) {
  const related = await getRelatedNews(post, 3)
  if (related.length === 0) return null
  return (
    <section className="border-t border-carbon/10 bg-smoke/50 py-14 sm:py-20" aria-labelledby="more-news">
      <Container className="space-y-8">
        <SectionHeading eyebrow="Keep reading" title={<span id="more-news">More from the paddock</span>} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.id}>
              <NewsCard post={item} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

function PostSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the post">
      <div className="bg-carbon py-16">
        <Container className="max-w-4xl space-y-4">
          <Skeleton className="h-4 w-40 bg-white/10" />
          <Skeleton className="h-16 w-full bg-white/10" />
        </Container>
      </div>
      <Container className="max-w-4xl space-y-4 py-12">
        <Skeleton className="aspect-[16/9] rounded-[2rem]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Container>
    </div>
  )
}
