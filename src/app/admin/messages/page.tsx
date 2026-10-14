import { MessagesSquare } from "lucide-react"

export const metadata = { title: "Messages" }

/** Right-hand pane before a conversation is picked. Hidden on small screens, where the list fills the page. */
export default function AdminMessagesPage() {
  return (
    <div className="hidden flex-col items-center justify-center gap-3 bg-paper/60 px-6 text-center lg:flex">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-lime-ink">
        <MessagesSquare className="size-6" aria-hidden />
      </span>
      <h2 className="font-display text-2xl font-bold uppercase">Pick a conversation</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Customers can message the workshop from the chat button on every page once they&apos;re logged in.
      </p>
    </div>
  )
}
