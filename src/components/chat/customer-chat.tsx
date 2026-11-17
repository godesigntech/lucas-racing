"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MessageCircle, X } from "lucide-react"

import { sendCustomerMessage, setChatDepartment } from "@/lib/actions/chat"
import { fetchCustomerConversation } from "@/lib/chat/queries"
import { markConversationRead, useChatThread } from "@/lib/chat/use-chat-thread"
import { useRealtimeRows } from "@/lib/chat/use-realtime-rows"
import { createClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import { departmentInfo, departments, isDepartment, type Department } from "@/types/chat"

import { ChatComposer } from "./chat-composer"
import { MessageList } from "./message-list"

interface CustomerChatProps {
  customerId: string
  firstName: string
}

type ConversationState = { id: string; unread: number; department: Department } | null

const PANEL_ID = "customer-chat-panel"

/** Floating live chat with the workshop, bottom left, for signed-in customers. */
export function CustomerChat({ customerId, firstName }: CustomerChatProps) {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [conversation, setConversation] = useState<ConversationState>(null)
  const launcher = useRef<HTMLButtonElement>(null)

  const refresh = useCallback(async () => {
    try {
      const found = await fetchCustomerConversation(createClient(), customerId)
      setConversation(found ? { id: found.id, unread: found.customerUnreadCount, department: found.department } : null)
    } catch {
      // The badge simply stays as it was; the next resync will try again.
    }
  }, [customerId])

  // Keeps the unread badge live, and picks up a conversation the workshop starts.
  useRealtimeRows({
    table: "conversations",
    filter: `customer_id=eq.${customerId}`,
    onChange: (payload) => {
      if (payload.eventType === "DELETE") setConversation(null)
      else setConversation({ id: payload.new.id, unread: payload.new.customer_unread_count, department: isDepartment(payload.new.department) ? payload.new.department : "lucas" })
    },
    onResync: refresh,
  })

  // Reading the panel clears the badge; the live update then brings the count back to zero.
  const conversationId = conversation?.id
  const unread = conversation?.unread ?? 0
  useEffect(() => {
    if (open && conversationId && unread > 0) void markConversationRead(conversationId, "customer")
  }, [open, conversationId, unread])

  function toggle() {
    setHasOpened(true)
    setOpen((value) => !value)
  }

  function close() {
    setOpen(false)
    launcher.current?.focus()
  }

  return (
    <>
      {hasOpened && (
        <CustomerChatPanel
          open={open}
          onClose={close}
          customerId={customerId}
          conversationId={conversationId ?? null}
          savedDepartment={conversation?.department ?? null}
          firstName={firstName}
        />
      )}
      <button
        ref={launcher}
        type="button"
        data-floating-launcher
        onClick={toggle}
        aria-expanded={open}
        aria-controls={hasOpened ? PANEL_ID : undefined}
        aria-label={open ? "Close chat" : unread ? `Chat with the workshop, ${unread} unread` : "Chat with the workshop"}
        className={cn(
          "fixed bottom-5 left-5 z-40 grid size-14 place-items-center rounded-full bg-carbon text-brand shadow-[0_12px_32px_-8px_rgb(17_20_18/0.6)] ring-1 ring-brand/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/60 active:scale-95",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
        {!open && unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.7rem] font-bold leading-5 text-carbon ring-2 ring-paper"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  )
}

interface CustomerChatPanelProps {
  open: boolean
  onClose: () => void
  customerId: string
  conversationId: string | null
  /** The team their conversation is with, once they have one. */
  savedDepartment: Department | null
  firstName: string
}

function CustomerChatPanel({ open, onClose, customerId, conversationId, savedDepartment, firstName }: CustomerChatPanelProps) {
  // Who they're talking to: their conversation's team, else HydroKarts on the customisation
  // pages (flagged on <html>, header-logo.tsx) and Lucas Racing everywhere else.
  const [chosen, setChosen] = useState<Department | null>(null)
  const pageTeam: Department = typeof document !== "undefined" && (document.documentElement.dataset.customisation || document.documentElement.dataset.customisationInitial) ? "hydrokarts" : "lucas"
  const department = chosen ?? savedDepartment ?? pageTeam
  const send = useCallback((values: Parameters<typeof sendCustomerMessage>[0]) => sendCustomerMessage(values, department), [department])
  const thread = useChatThread({
    conversationId,
    viewerRole: "customer",
    customerId,
    send,
    enabled: open,
  })

  function pickTeam(next: Department) {
    setChosen(next)
    if (conversationId) void setChatDepartment(next)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <section
      id={PANEL_ID}
      role="dialog"
      aria-label="Chat with the workshop"
      hidden={!open}
      className="fixed z-50 flex flex-col overflow-hidden bg-card shadow-[0_24px_64px_-16px_rgb(17_20_18/0.45)] ring-1 ring-carbon/10 max-sm:inset-0 sm:bottom-24 sm:left-5 sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[23rem] sm:rounded-3xl"
    >
      <header className="grid-texture flex items-center gap-3 bg-carbon px-4 py-3.5 text-paper">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-bold text-carbon" aria-hidden>
          LR
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold uppercase leading-none">{departmentInfo[department].label}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-paper/65">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden /> We usually reply within a few hours
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/10 hover:text-paper"
          aria-label="Close chat"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div role="radiogroup" aria-label="Who would you like to talk to?" className="grid grid-cols-2 gap-1.5 border-b border-carbon/10 bg-card p-2">
        {departments.map((team) => (
          <button
            key={team}
            type="button"
            role="radio"
            aria-checked={department === team}
            onClick={() => pickTeam(team)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-left transition-colors",
              department === team ? "bg-carbon text-paper" : "text-carbon hover:bg-carbon/5",
            )}
          >
            <span className="block text-sm font-semibold leading-tight">{departmentInfo[team].label}</span>
            <span className={cn("block text-[0.7rem] leading-tight", department === team ? "text-paper/70" : "text-muted-foreground")}>{departmentInfo[team].topics}</span>
          </button>
        ))}
      </div>

      <MessageList
        messages={thread.messages}
        viewerRole="customer"
        otherLabel="The workshop"
        loading={!thread.loaded}
        onRetry={thread.retry}
        className="bg-paper"
        empty={
          <div className="flex h-full flex-col justify-end">
            <div className="max-w-[85%] rounded-3xl rounded-bl-lg bg-carbon/[0.06] px-4 py-3 text-sm leading-relaxed">
              <p className="font-semibold">Hi {firstName || "there"} 👋</p>
              <p className="mt-1 text-carbon/80">
                Ask us anything about a design, an order or sending in your own helmet. You can add photos too.
              </p>
            </div>
          </div>
        }
      />

      {open && <ChatComposer onSend={thread.sendMessage} autoFocus />}
    </section>
  )
}
