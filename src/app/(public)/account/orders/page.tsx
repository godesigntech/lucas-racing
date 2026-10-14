import { Suspense } from "react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { OrderList } from "@/components/account/order-list"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyOrders } from "@/lib/data/account"

export const metadata = { title: "Orders" }

export default function AccountOrdersPage() {
  return (
    <>
      <AccountPageHeader title="Orders" description="Every helmet you've ordered, newest first." />
      <Suspense fallback={<Skeleton className="h-80 rounded-3xl" />}>
        <Orders />
      </Suspense>
    </>
  )
}

async function Orders() {
  const orders = await getMyOrders()
  return <OrderList orders={orders} />
}
