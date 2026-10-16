import { formatDateTime } from "@/lib/format"
import { orderStatusMeta, paymentStatusMeta } from "@/lib/orders/status"
import type { OrderEvent } from "@/types/order"

/** Status history, newest first. */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  const ordered = [...events].reverse()
  return (
    <ol className="relative space-y-5 border-l border-carbon/15 pl-6">
      {ordered.map((event, index) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className={
              index === 0
                ? "absolute -left-[1.86rem] top-1 size-3 rounded-full bg-brand ring-4 ring-card"
                : "absolute -left-[1.8rem] top-1.5 size-2 rounded-full bg-carbon/30 ring-4 ring-card"
            }
          />
          <p className="text-sm font-semibold">
            {orderStatusMeta[event.status]?.label ?? event.status}
            {event.paymentStatus && (
              <span className="font-normal text-muted-foreground"> · {paymentStatusMeta[event.paymentStatus].label}</span>
            )}
          </p>
          {event.note && <p className="mt-0.5 text-sm text-carbon/75">{event.note}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
        </li>
      ))}
    </ol>
  )
}
