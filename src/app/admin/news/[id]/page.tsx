import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { NewsPostEditor } from "@/components/admin/news/news-post-editor"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminNewsPost, listAdminNewsCategories } from "@/lib/data/news"
import { formatDateTime } from "@/lib/format"
import { isFuture } from "@/lib/news/text"

export const metadata = { title: "Edit post" }

export default function AdminNewsPostPage({ params }: PageProps<"/admin/news/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <Editor id={id} />
      ))}
    </Suspense>
  )
}

async function Editor({ id }: { id: string }) {
  const [post, categories] = await Promise.all([getAdminNewsPost(id), listAdminNewsCategories()])
  const state =
    post.status === "draft"
      ? "Draft"
      : isFuture(post.publishedAt)
        ? `Scheduled for ${formatDateTime(post.publishedAt!)}`
        : `Published ${post.publishedAt ? formatDateTime(post.publishedAt) : ""}`

  return (
    <>
      <AdminPageHeader back={{ href: "/admin/news", label: "News" }} title={post.title} description={`${state} · last saved ${formatDateTime(post.updatedAt)}`} />
      <NewsPostEditor post={post} categories={categories} />
    </>
  )
}
