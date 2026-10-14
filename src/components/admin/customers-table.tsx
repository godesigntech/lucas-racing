import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { UserAvatar } from "@/components/shared/user-avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/format"
import type { CustomerSummary } from "@/types/account"

export function CustomersTable({ customers, emptyMessage }: { customers: CustomerSummary[]; emptyMessage: string }) {
  if (customers.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      <ul className="divide-y divide-carbon/10 md:hidden">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-foreground/[0.03]">
              <UserAvatar name={customer.fullName || customer.email} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{customer.fullName || "No name yet"}</p>
                <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold tabular-nums">{formatMoney(customer.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Customer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Total spent</TableHead>
            <TableHead>Last order</TableHead>
            <TableHead className="pr-5">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="relative">
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <UserAvatar name={customer.fullName || customer.email} size="sm" />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium after:absolute after:inset-0 after:content-[''] hover:underline"
                    >
                      {customer.fullName || "No name yet"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[customer.city, customer.postcode].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{customer.orderCount}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMoney(customer.totalSpent)}</TableCell>
              <TableCell className="text-muted-foreground">
                {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
              </TableCell>
              <TableCell className="pr-5 text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
