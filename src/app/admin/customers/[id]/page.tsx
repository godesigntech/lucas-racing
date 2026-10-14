import { Suspense } from "react"
import { CalendarDays, Mail, MapPin, Phone, PoundSterling, ShoppingBag } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { OrdersTable } from "@/components/admin/orders-table"
import { StatCard } from "@/components/admin/stat-card"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getCustomer } from "@/lib/data/admin"
import { formatDate, formatMoney } from "@/lib/format"

export const metadata = { title: "Customer" }

export default function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem] rounded-2xl" />}>
      {params.then(({ id }) => (
        <CustomerDetail id={id} />
      ))}
    </Suspense>
  )
}

async function CustomerDetail({ id }: { id: string }) {
  const { profile, summary, orders } = await getCustomer(id)
  const address = [profile.addressLine1, profile.addressLine2, profile.city, profile.county, profile.postcode, profile.country].filter(Boolean)

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={
          <span className="flex items-center gap-4">
            <UserAvatar name={profile.fullName || profile.email} size="lg" />
            <span className="min-w-0 truncate">{profile.fullName || "No name yet"}</span>
          </span>
        }
        description={`Customer since ${formatDate(profile.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <AdminCard title="Contact">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <a href={`mailto:${profile.email}`} className="break-all underline-offset-4 hover:underline">
                {profile.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{profile.phone || "No phone number"}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              {address.length ? (
                <address className="not-italic leading-relaxed">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              ) : (
                <span>No saved address</span>
              )}
            </li>
            <li className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>Joined {formatDate(profile.createdAt)}</span>
            </li>
          </ul>
        </AdminCard>

        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={ShoppingBag} label="Orders" value={String(summary.orderCount)} />
            <StatCard
              icon={PoundSterling}
              label="Total spent"
              value={formatMoney(summary.totalSpent)}
              hint="Excludes cancelled orders"
            />
          </div>
          <AdminCard title="Order history" flush>
            <OrdersTable orders={orders} hideCustomer emptyMessage="This customer hasn't ordered yet." />
          </AdminCard>
        </div>
      </div>
    </>
  )
}
