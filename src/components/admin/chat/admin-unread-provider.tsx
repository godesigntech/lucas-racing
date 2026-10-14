"use client"

import { createContext, useCallback, useContext, useState } from "react"

import { useRealtimeRows } from "@/lib/chat/use-realtime-rows"
import { createClient } from "@/lib/supabase/browser"

const AdminUnreadContext = createContext(0)

/** Number of customer conversations waiting for a reply, kept live for the admin nav. */
export function useAdminUnreadCount(): number {
  return useContext(AdminUnreadContext)
}

export function AdminUnreadProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const { count: unread, error } = await createClient()
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .gt("admin_unread_count", 0)
    if (!error) setCount(unread ?? 0)
  }, [])

  useRealtimeRows({ table: "conversations", enabled, onChange: refresh, onResync: refresh })

  return <AdminUnreadContext value={count}>{children}</AdminUnreadContext>
}
