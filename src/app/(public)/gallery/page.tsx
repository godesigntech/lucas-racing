import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Camera, Images } from "lucide-react"

import { Container } from "@/components/layout/container"
import { ComingSoon } from "@/components/shared/coming-soon"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { images } from "@/constants/images"
import { getGalleryAlbums } from "@/lib/data/gallery"
import { getSiteSettings } from "@/lib/data/settings"
import { formatDate } from "@/lib/format"

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
        <Container>
          {albums.length === 0 ? (
            <div className="flex flex-col items-center rounded-[2rem] border border-dashed border-carbon/20 px-6 py-16 text-center">
              <Camera className="size-10 text-muted-foreground" aria-hidden />
              <h2 className="mt-4 font-display text-3xl font-bold uppercase">Photos coming soon</h2>
              <p className="mt-2 max-w-md text-muted-foreground">We&apos;re putting together albums from this season&apos;s race weekends.</p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/news">Read the latest news</Link>
              </Button>
            </div>
          ) : (
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
        </Container>
      </section>
    </>
  )
}
