"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessagesSquare } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { startConversation } from "@/lib/actions/admin/chat"

/** Opens the chat with a customer from their profile, starting one if needed. */
export function MessageCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function open() {
    startTransition(async () => {
      const result = await startConversation(customerId)
      if (result.ok && result.data) router.push(`/admin/messages/${result.data.conversationId}`)
      else if (!result.ok) toast.error(result.message)
    })
  }

  return (
    <Button onClick={open} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <MessagesSquare aria-hidden />}
      Message
    </Button>
  )
}
