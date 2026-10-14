import { notFound } from "next/navigation"

import type { AdminUser, CustomerSummary, Profile } from "@/types/account"
import { orderStatuses, type OrderListItem, type OrderStatus } from "@/types/order"

import { demoFilms, demoModels, demoOptions, demoProducts, demoSettings } from "./catalog"
import { demoAdmins, demoCustomerSummaries, demoOrders, demoProfiles, demoUser } from "./people"

// Demo-mode versions of the admin queries in src/lib/data/admin.ts.

const PAGE_SIZE = 20

function paginate<T>(rows: T[], page: number) {
  const current = Math.max(1, Math.floor(page) || 1)
  return {
    rows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: rows.length,
    page: current,
    pageCount: Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  }
}

const matches = (query: string | undefined, ...fields: string[]) =>
  !query || fields.some((field) => field.toLowerCase().includes(query.trim().toLowerCase()))

const toListItem = ({ id, orderNumber, status, paymentStatus, customerName, customerEmail, total, itemCount, createdAt }: (typeof demoOrders)[number]): OrderListItem => ({
  id,
  orderNumber,
  status,
  paymentStatus,
  customerName,
  customerEmail,
  total,
  itemCount,
  createdAt,
})

export const demoAdmin = {
  dashboardStats() {
    const statusCounts = Object.fromEntries(orderStatuses.map((status) => [status, 0])) as Record<OrderStatus, number>
    for (const order of demoOrders) statusCounts[order.status] += 1
    const live = demoOrders.filter((order) => order.status !== "cancelled")
    return {
      revenuePaid: demoOrders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0),
      revenueLast30Days: live.reduce((sum, order) => sum + order.total, 0),
      ordersLast30Days: demoOrders.length,
      openOrders: demoOrders.filter((order) => !["completed", "cancelled"].includes(order.status)).length,
      awaitingPayment: live.filter((order) => order.paymentStatus === "unpaid").length,
      customerCount: demoProfiles.length,
      statusCounts,
      recentOrders: demoOrders.slice(0, 6).map(toListItem),
    }
  },

  listOrders(options: { query?: string; status?: string; page?: number }) {
    const rows = demoOrders
      .filter((order) => !options.status || order.status === options.status)
      .filter((order) => matches(options.query, order.orderNumber, order.customerName, order.customerEmail))
      .map(toListItem)
    return paginate(rows, options.page ?? 1)
  },

  order(id: string) {
    const order = demoOrders.find((entry) => entry.id === id)
    if (!order) notFound()
    return order
  },

  listCustomers(options: { query?: string; page?: number }) {
    const rows = demoCustomerSummaries().filter((customer) =>
      matches(options.query, customer.fullName, customer.email, customer.postcode),
    )
    return paginate(rows, options.page ?? 1)
  },

  customer(id: string): { profile: Profile; summary: CustomerSummary; orders: OrderListItem[] } {
    const profile = demoProfiles.find((entry) => entry.id === id)
    const summary = demoCustomerSummaries().find((entry) => entry.id === id)
    if (!profile || !summary) notFound()
    return { profile, summary, orders: demoOrders.filter((order) => order.userId === id).map(toListItem) }
  },

  products: () => demoProducts,
  product(slug: string) {
    const product = demoProducts.find((entry) => entry.slug === slug)
    if (!product) notFound()
    return product
  },
  films: () => demoFilms,
  models: () => demoModels,
  options: () => demoOptions,
  settings: (): { settings: typeof demoSettings; admins: AdminUser[]; currentEmail: string } => ({
    settings: demoSettings,
    admins: demoAdmins,
    currentEmail: demoUser.email,
  }),
}
