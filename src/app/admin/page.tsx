import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, Clock, Inbox, PoundSterling, ShoppingBag, Sparkles, Users, type LucideIcon } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { OrdersTable } from "@/components/admin/orders-table"
import { StatCard } from "@/components/admin/stat-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardStats } from "@/lib/data/admin"
import { countNewEnquiries } from "@/lib/data/enquiries"
import { countNewQuoteRequests } from "@/lib/data/quotes"
import { formatMoney } from "@/lib/format"
import { orderStatusMeta, toneClasses } from "@/lib/orders/status"
import { cn } from "@/lib/utils"
import { orderStatuses } from "@/types/order"

export const metadata = { title: "Dashboard" }

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" description="How the shop is doing at a glance." />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  )
}

async function Dashboard() {
  const [stats, newQuotes, newEnquiries] = await Promise.all([getDashboardStats(), countNewQuoteRequests(), countNewEnquiries()])
  const attention = [
    { count: newQuotes, icon: Sparkles, href: "/admin/quotes?status=new", label: `new quote ${newQuotes === 1 ? "request" : "requests"}`, hint: "From the design assistant" },
    { count: newEnquiries, icon: Inbox, href: "/admin/enquiries", label: `new ${newEnquiries === 1 ? "enquiry" : "enquiries"}`, hint: "From the contact form" },
  ].filter((item) => item.count > 0)
  const totalOrders = orderStatuses.reduce((sum, status) => sum + stats.statusCounts[status], 0)

  return (
    <div className="space-y-6">
      {attention.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {attention.map((item) => (
            <AttentionLink key={item.href} {...item} />
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          icon={PoundSterling}
          label="Revenue (last 30 days)"
          value={formatMoney(stats.revenueLast30Days)}
          hint={`${formatMoney(stats.revenuePaid)} paid in total`}
        />
        <StatCard icon={ShoppingBag} label="Orders (last 30 days)" value={String(stats.ordersLast30Days)} hint={`${totalOrders} all time`} />
        <StatCard icon={Clock} label="Open orders" value={String(stats.openOrders)} hint={`${stats.awaitingPayment} awaiting payment`} />
        <StatCard icon={Users} label="Customers" value={String(stats.customerCount)} hint="Registered accounts" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <AdminCard
          title="Recent orders"
          flush
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                All orders <ArrowRight />
              </Link>
            </Button>
          }
        >
          <OrdersTable orders={stats.recentOrders} emptyMessage="No orders yet. They'll appear here as soon as customers check out." />
        </AdminCard>

        <AdminCard title="Orders by status">
          <ul className="space-y-3">
            {orderStatuses.map((status) => {
              const count = stats.statusCounts[status]
              const share = totalOrders ? Math.round((count / totalOrders) * 100) : 0
              return (
                <li key={status}>
                  <Link href={`/admin/orders?status=${status}`} className="group block space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium group-hover:underline">{orderStatusMeta[status].label}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-carbon/5">
                      <div
                        className={cn("h-full rounded-full ring-1 ring-inset", toneClasses[orderStatusMeta[status].tone])}
                        style={{ width: `${Math.max(share, count ? 4 : 0)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </AdminCard>
      </div>
    </div>
  )
}

/** "Needs a reply" shortcut shown at the top of the dashboard. */
function AttentionLink({ count, icon: Icon, href, label, hint }: { count: number; icon: LucideIcon; href: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-lime-ink/20 bg-accent px-5 py-4 transition-colors hover:border-lime-ink/40"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-carbon text-lime">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          {count} {label}
        </span>
        <span className="block text-sm text-carbon/70">{hint} · waiting for a reply</span>
      </span>
      <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}
