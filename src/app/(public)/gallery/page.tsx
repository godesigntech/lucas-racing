import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Images } from "lucide-react"

import { FacebookPageFeed } from "@/components/gallery/facebook-page-feed"
import { Container } from "@/components/layout/container"
import { ComingSoon } from "@/components/shared/coming-soon"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"
import { getGalleryAlbums } from "@/lib/data/gallery"
import { getSiteSettings } from "@/lib/data/settings"
import { formatDate } from "@/lib/format"

/**
 * Facebook pages shown on the gallery. Facebook only lets a page's posts show on other sites
 * when the page allows it: BPEC's settings don't, so it links to its photos instead.
 */
const facebookPages = [
  { name: "Lucas Racing", url: "https://www.facebook.com/lucasracingmskart", embed: true },
  { name: "BPEC Karting", url: "https://www.facebook.com/BPECKARTING/photos", embed: false },
]

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from race weekends, the Lucas Racing team and life in the paddock.",
}

export default async function GalleryPage() {
  const [settings, albums] = await Promise.all([getSiteSettings(), getGalleryAlbums()])
  if (!settings.showGallery) {
    return (
      <ComingSoon
        eyebrow="Gallery"
        title="Life in the paddock"
        description="Photos from race weekends, the team and the people who make Lucas Racing what it is."
        image={images.teamAwning}
        points={["Race weekend photo albums", "Drivers, karts and the team in action", "Events and open days"]}
        enquiryMessage="Hi, I have some photos from a race weekend: "
      />
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Life in the paddock"
        description="Photos from race weekends, the team and the people who make Lucas Racing what it is."
        image={images.teamAwning}
      />
      <section className="py-12 sm:py-16">
        <Container className="space-y-14">
          {albums.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album, index) => (
                <li key={album.id} className="reveal">
                  <Link
                    href={`/gallery/${album.slug}`}
                    className="group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-3xl bg-carbon p-6 text-paper outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {album.coverUrl && (
                      <Image
                        src={album.coverUrl}
                        alt=""
                        fill
                        preload={index < 3}
                        sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
                        className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-carbon via-carbon/30 to-transparent" />
                    <p className="eyebrow text-brand">
                      {[album.event, album.albumDate ? formatDate(album.albumDate) : ""].filter(Boolean).join(" · ") || "Album"}
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none">{album.title}</h2>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-paper/75">
                      <Images className="size-4" aria-hidden /> {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-brand-ink">Latest from Facebook</p>
                <h2 className="mt-1 font-display text-4xl font-bold uppercase leading-none">Photos and news from the paddock</h2>
              </div>
            </div>
            <ul className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {facebookPages.map((page) => (
                <li key={page.url} className="rounded-3xl border border-carbon/10 bg-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-bold uppercase leading-none">{page.name}</h3>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-ink underline-offset-4 hover:underline"
                    >
                      Open on Facebook <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </div>
                  {page.embed ? (
                    <FacebookPageFeed pageUrl={page.url} name={page.name} />
                  ) : (
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 rounded-2xl bg-carbon p-5 text-paper transition-colors hover:bg-carbon/90"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-carbon">
                        <Images className="size-6" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">See their race photos</span>
                        <span className="block text-sm text-paper/70">Opens their photo albums on Facebook.</span>
                      </span>
                      <ExternalLink className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  )
}
