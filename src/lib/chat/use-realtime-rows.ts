"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/browser"

type Tables = Database["public"]["Tables"]
type ChatTable = "messages" | "conversations"

interface RealtimeRowsOptions<T extends ChatTable> {
  table: T
  /** PostgREST-style filter such as "conversation_id=eq.<id>". Row level security applies either way. */
  filter?: string
  event?: "INSERT" | "UPDATE" | "*"
  /** Skip subscribing, e.g. until a conversation exists. */
  enabled?: boolean
  onChange: (payload: RealtimePostgresChangesPayload<Tables[T]["Row"]>) => void
  /**
   * Runs once the subscription is live and whenever the tab becomes visible again,
   * so callers can refetch anything missed while disconnected or asleep.
   */
  onResync?: () => void
}

/** Subscribes to live row changes on one chat table for as long as the component is mounted. */
export function useRealtimeRows<T extends ChatTable>({
  table,
  filter,
  event = "*",
  enabled = true,
  onChange,
  onResync,
}: RealtimeRowsOptions<T>) {
  // Keep the latest callbacks without resubscribing on every render.
  const handlers = useRef({ onChange, onResync })
  useEffect(() => {
    handlers.current = { onChange, onResync }
  })

  useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    let channel: RealtimeChannel | null = null
    let cancelled = false

    async function subscribe() {
      // Load the session token first: a channel that joins before it is attached joins as a
      // guest, and row level security then hides every change from it.
      await supabase.realtime.setAuth()
      if (cancelled) return
      // A unique topic per hook instance, so two components never share (and tear down) one channel.
      channel = supabase
        .channel(`${table}:${filter ?? "all"}:${crypto.randomUUID()}`)
        .on(
          // The overloads don't accept a union event type, hence the cast.
          "postgres_changes" as never,
          { event, schema: "public", table, filter },
          (payload: RealtimePostgresChangesPayload<Tables[T]["Row"]>) => handlers.current.onChange(payload),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") handlers.current.onResync?.()
        })
    }
    void subscribe()

    const onVisible = () => {
      if (document.visibilityState === "visible") handlers.current.onResync?.()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [table, filter, event, enabled])
}
