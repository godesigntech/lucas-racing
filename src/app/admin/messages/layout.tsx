import { Suspense } from "react"

import { ConversationList } from "@/components/admin/chat/conversation-list"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminConversations } from "@/lib/data/chat"

/** Two-pane inbox: conversations on the left, the open thread on the right (one pane at a time on small screens). */
export default function AdminMessagesLayout({ children }: LayoutProps<"/admin/messages">) {
  return (
    <div className="grid h-[calc(100dvh-7rem)] min-h-[30rem] grid-rows-1 overflow-hidden rounded-2xl border border-carbon/10 bg-card sm:h-[calc(100dvh-8rem)] lg:grid-cols-[21rem_minmax(0,1fr)]">
      <Suspense fallback={<InboxSkeleton />}>
        <Conversations />
      </Suspense>
      {children}
    </div>
  )
}

async function Conversations() {
  const conversations = await listAdminConversations()
  return <ConversationList initialConversations={conversations} />
}

function InboxSkeleton() {
  return (
    <div className="space-y-3 border-carbon/10 p-4 lg:border-r" aria-busy="true" aria-label="Loading conversations">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 rounded-full" />
      <Skeleton className="h-10 rounded-full" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
