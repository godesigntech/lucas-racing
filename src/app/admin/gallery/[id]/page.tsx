import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AlbumForm } from "@/components/admin/gallery/album-form"
import { DeleteAlbumButton } from "@/components/admin/gallery/delete-album-button"
import { PhotoManager } from "@/components/admin/gallery/photo-manager"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminAlbum } from "@/lib/data/gallery"

export const metadata = { title: "Album" }

export default function AdminAlbumPage({ params }: PageProps<"/admin/gallery/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <AlbumEditor id={id} />
      ))}
    </Suspense>
  )
}

async function AlbumEditor({ id }: { id: string }) {
  const album = await getAdminAlbum(id)
  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/gallery", label: "Gallery" }}
        title={album.title}
        description={`${album.isPublished ? "On the website" : "Hidden"} · ${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`}
        actions={
          <>
            {album.isPublished && album.photoCount > 0 && (
              <Button asChild variant="outline">
                <Link href={`/gallery/${album.slug}`} target="_blank">
                  View <ExternalLink />
                </Link>
              </Button>
            )}
            <DeleteAlbumButton id={album.id} title={album.title} />
          </>
        }
      />
      <div className="space-y-6">
        <AdminCard title="Album details">
          <AlbumForm album={album} />
        </AdminCard>
        <AdminCard title="Photos" description="The first photo is the cover unless you choose another.">
          <PhotoManager album={album} />
        </AdminCard>
      </div>
    </>
  )
}
