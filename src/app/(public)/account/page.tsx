import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, MapPin, Pencil, ShieldCheck } from "lucide-react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { OrderList } from "@/components/account/order-list"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import { getMyOrders, getMyProfile } from "@/lib/data/account"

export const metadata = { title: "Overview" }

export default function AccountOverviewPage() {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview />
    </Suspense>
  )
}

async function Overview() {
  const [user, profile, orders] = await Promise.all([getCurrentUser(), getMyProfile(), getMyOrders(3)])
  const firstName = profile.fullName.split(" ")[0] || "there"
  const address = [profile.addressLine1, profile.city, profile.postcode].filter(Boolean).join(", ")

  return (
    <>
      <AccountPageHeader title={`Hi, ${firstName}`} description="Track your orders and keep your details up to date." />

      <div className="grid gap-6">
        {user?.isAdmin && (
          <section className="flex flex-col gap-4 rounded-3xl bg-carbon p-6 text-paper sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-carbon">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold uppercase">You&apos;re an admin</h2>
                <p className="text-sm text-paper/70">Manage orders, customers, prices and store settings.</p>
              </div>
            </div>
            <Button asChild size="lg" className="self-start sm:self-auto">
              <Link href="/admin">
                Open admin portal <ArrowRight />
              </Link>
            </Button>
          </section>
        )}

        <section aria-labelledby="recent-orders" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recent-orders" className="font-display text-2xl font-bold uppercase">
              Recent orders
            </h2>
            {orders.length > 0 && (
              <Button asChild variant="link" size="sm">
                <Link href="/account/orders">
                  View all <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
          <OrderList orders={orders} />
        </section>

        <section
          aria-labelledby="your-details"
          className="flex flex-col gap-5 rounded-3xl border border-carbon/10 bg-card p-6 sm:flex-row sm:items-center"
        >
          <UserAvatar name={profile.fullName || profile.email} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id="your-details" className="font-display text-2xl font-bold uppercase">
              {profile.fullName || "Your details"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {address || "No delivery address saved yet"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/account/profile">
              <Pencil /> Edit profile
            </Link>
          </Button>
        </section>
      </div>
    </>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your account">
      <Skeleton className="h-16 w-64" />
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  )
}
