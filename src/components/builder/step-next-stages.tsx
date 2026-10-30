"use client"

import Link from "next/link"
import { ArrowRight, CalendarCheck, Camera, CreditCard, PencilLine, ShieldCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { addWeeks, formatUkDate, formatWeek } from "@/lib/dates/uk"
import { formatMoney } from "@/lib/format"
import { orderStatusMeta } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import type { ProductionOptions } from "@/lib/data/production"
import type { OrderStatus } from "@/types/order"

/**
 * Steps 15 and 16 of the journey. They happen after the basket — on the checkout page
 * and then on the customer's order page — so there is nothing to configure here. What
 * there is, is an honest preview: step 15 shows the real next available production week
 * read from the database, and step 16 shows the stages an order actually moves through.
 */

function Row({ icon: Icon, title, children }: { icon: typeof Truck; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-paddock/70">
        <Icon className="size-4 text-brand-ink" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
    </li>
  )
}

/** Step 15: what the checkout page will ask for, and when we could start. */
export function StepConfirm({
  production,
  hasBasketItem,
  enquiryHref,
  blocked,
}: {
  production: ProductionOptions
  hasBasketItem: boolean
  enquiryHref: string
  blocked: boolean
}) {
  const nextWeek = production.weeks.find((week) => week.isBookable)
  const rushTiers = production.tiers.filter((tier) => tier.key !== "standard")

  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-paddock/50 p-4 text-sm text-muted-foreground">
        This step happens on the checkout page once your helmet is in the basket. Here&apos;s what it covers.
      </p>

      <ul className="space-y-4">
        <Row icon={Truck} title="Your details and delivery">
          Name, email and phone, then courier, collection from the workshop, or a track-side handover.
        </Row>
        <Row icon={CalendarCheck} title="Your production week">
          {production.ready && nextWeek ? (
            <>
              You pick when your helmet goes into the workshop. The soonest we could start is the week of{" "}
              <strong className="font-semibold text-carbon">{formatWeek(nextWeek.weekStart)}</strong>, which would be
              finished around{" "}
              <strong className="font-semibold text-carbon">
                {formatUkDate(addWeeks(nextWeek.weekStart, production.standardLeadWeeks))}
              </strong>
              .
            </>
          ) : (
            "You pick when your helmet goes into the workshop, and we show the completion date that follows from it."
          )}
        </Row>
        {rushTiers.length > 0 && (
          <Row icon={ArrowRight} title="Need it sooner?">
            {rushTiers
              .map((tier) => `${tier.label}${tier.fee ? ` (+${formatMoney(tier.fee)})` : ""}`)
              .join(", ")}
            .
          </Row>
        )}
        <Row icon={CreditCard} title="No payment today">
          You order without paying. We send a payment link once you&apos;ve approved your proof.
        </Row>
      </ul>

      {production.ready && !nextWeek && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Every week we can see is full at the moment. You can still order, and we&apos;ll call you with the soonest
          date.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {blocked ? (
          <Button asChild size="lg">
            <Link href={enquiryHref}>Send an enquiry instead</Link>
          </Button>
        ) : hasBasketItem ? (
          <Button asChild size="lg">
            <Link href="/checkout">
              Go to checkout <ArrowRight />
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add your helmet to the basket at step 14, then checkout opens here.
          </p>
        )}
      </div>
    </div>
  )
}

/** The stages a real order moves through, in order. */
const journey: OrderStatus[] = [
  "pending",
  "awaiting_design_review",
  "awaiting_proof_approval",
  "approved_for_production",
  "scheduled",
  "in_production",
  "quality_check",
  "ready",
  "completed",
]

/** Step 16: what happens after the order is placed. */
export function StepProduction() {
  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-paddock/50 p-4 text-sm text-muted-foreground">
        Once your order is placed you can follow it from your account. These are the stages it moves through.
      </p>

      <ol className="space-y-3">
        {journey.map((status, index) => {
          const meta = orderStatusMeta[status]
          const isGate = status === "awaiting_proof_approval"
          return (
            <li
              key={status}
              className={cn(
                "flex gap-3 rounded-2xl border p-3",
                isGate ? "border-brand-ink/30 bg-accent/40" : "border-carbon/10",
              )}
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-carbon/8 text-xs font-bold">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{meta.label}</span>
                <span className="block text-sm text-muted-foreground">{meta.description}</span>
                {isGate && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-ink">
                    <PencilLine className="size-3.5" aria-hidden />
                    Nothing is painted until you approve or ask for changes
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      <ul className="space-y-4">
        <Row icon={ShieldCheck} title="You sign off the design">
          We email a proof. Approve it or ask for changes — changes at that stage are free.
        </Row>
        <Row icon={Camera} title="Photos of the finished helmet">
          The workshop adds them to your order when it&apos;s done.
        </Row>
      </ul>

      <Button asChild variant="outline" size="lg">
        {/* Signed-out visitors are sent to the login page by the proxy. */}
        <Link href="/account/orders">
          Track an order <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
