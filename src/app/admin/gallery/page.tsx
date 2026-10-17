import { Suspense } from "react"
import Link from "next/link"
import { ChevronRight, Images } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { NewAlbumDialog } from "@/components/admin/gallery/new-album-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminAlbums } from "@/lib/data/gallery"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata = { title: "Gallery" }

export default function AdminGalleryPage() {
  return (
    <>
      <AdminPageHeader
        title="Gallery"
        description="Photo albums from race weekends and events. Only use photos the client has supplied or approved."
        actions={<NewAlbumDialog />}
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <AlbumList />
      </Suspense>
    </>
  )
}

async function AlbumList() {
  const albums = await listAdminAlbums()
  return (
    <AdminCard flush>
      {albums.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <Images className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">No albums yet. Create one and add photos.</p>
        </div>
      ) : (
        <ul className="divide-y divide-carbon/10">
          {albums.map((album) => (
            <li key={album.id}>
              <Link href={`/admin/gallery/${album.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-carbon/[0.02]">
                <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-carbon/5">
                  {album.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={album.coverUrl} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold group-hover:underline">{album.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-semibold",
                        album.isPublished ? "bg-emerald-100 text-emerald-900" : "bg-carbon/10 text-carbon",
                      )}
                    >
                      {album.isPublished ? "Published" : "Hidden"}
                    </span>
                    <span>
                      {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                    </span>
                    {album.albumDate && <span>{formatDate(album.albumDate)}</span>}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  )
}
