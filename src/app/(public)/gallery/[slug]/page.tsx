import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PhotoLightbox } from "@/components/gallery/photo-lightbox"
import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { getGalleryAlbum } from "@/lib/data/gallery"
import { getSiteSettings } from "@/lib/data/settings"
import { formatDate } from "@/lib/format"

export async function generateMetadata({ params }: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const album = await getGalleryAlbum((await params).slug)
  if (!album) return { title: "Album not found" }
  return {
    title: `${album.title} | Gallery`,
    description: album.description || `Photos from ${album.title}, by Lucas Racing.`,
    alternates: { canonical: `/gallery/${album.slug}` },
    openGraph: album.coverUrl ? { images: [album.coverUrl] } : undefined,
  }
}

export default function GalleryAlbumPage({ params }: PageProps<"/gallery/[slug]">) {
  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-8">
        <Suspense fallback={<Skeleton className="h-[30rem] rounded-3xl" />}>
          {params.then(({ slug }) => (
            <Album slug={slug} />
          ))}
        </Suspense>
      </Container>
    </section>
  )
}

async function Album({ slug }: { slug: string }) {
  const [album, settings] = await Promise.all([getGalleryAlbum(slug), getSiteSettings()])
  if (!album || !settings.showGallery) notFound()
  const meta = [album.event, album.albumDate ? formatDate(album.albumDate) : "", `${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`].filter(Boolean)

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Gallery", href: "/gallery" }, { label: album.title }]} />
      <div className="max-w-3xl space-y-3">
        <p className="eyebrow text-brand-ink">{meta.join(" · ")}</p>
        <h1 className="display text-5xl sm:text-6xl">{album.title}</h1>
        {album.description && <p className="text-lg leading-relaxed text-muted-foreground">{album.description}</p>}
      </div>
      {album.photos.length > 0 ? (
        <PhotoLightbox photos={album.photos} albumTitle={album.title} />
      ) : (
        <p className="text-muted-foreground">Photos for this album are on the way.</p>
      )}
    </>
  )
}
