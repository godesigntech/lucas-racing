import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AdminChatThread } from "@/components/admin/chat/admin-chat-thread"
import { getAdminConversation } from "@/lib/data/chat"

export const metadata = { title: "Conversation" }

export default function AdminConversationPage({ params }: PageProps<"/admin/messages/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-label="Loading conversation" />
        </div>
      }
    >
      {params.then(({ id }) => (
        <Thread id={id} />
      ))}
    </Suspense>
  )
}

async function Thread({ id }: { id: string }) {
  const { conversation, messages } = await getAdminConversation(id)
  return <AdminChatThread key={conversation.id} conversation={conversation} initialMessages={messages} />
}
