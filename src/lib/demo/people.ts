import type { AdminUser, CurrentUser, CustomerSummary, Profile } from "@/types/account"
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types/order"

import { demoProducts } from "./catalog"

// Sample customers and orders for demo mode. Dates are fixed so pages render the same every time.

export const demoUser: CurrentUser = {
  id: "demo-admin",
  email: "demo@lucasracing.co.uk",
  fullName: "Demo Admin",
  isAdmin: true,
  isStaff: true,
  role: "admin",
}

const profile = (id: string, fullName: string, email: string, city: string, postcode: string, createdAt: string): Profile => ({
  id,
  email,
  fullName,
  phone: "07700 900123",
  addressLine1: "12 Paddock Lane",
  addressLine2: "",
  city,
  county: "",
  postcode,
  country: "United Kingdom",
  createdAt,
})

export const demoProfiles: Profile[] = [
  profile(demoUser.id, demoUser.fullName, demoUser.email, "Stockton-on-Tees", "TS18 1AA", "2026-09-01T09:00:00Z"),
  profile("demo-customer-1", "Alex Driver", "alex@example.com", "Middlesbrough", "TS1 2AB", "2026-09-20T10:15:00Z"),
  profile("demo-customer-2", "Sam Racer", "sam@example.com", "Leeds", "LS1 4AP", "2026-10-02T14:40:00Z"),
  profile("demo-customer-3", "Jordan Apex", "jordan@example.com", "Newcastle upon Tyne", "NE1 5DL", "2026-10-08T18:05:00Z"),
]

function item(slug: string, model: string, size: string, finish: string, film: string, trim: string, unitPrice: number, quantity = 1): OrderItem {
  const product = demoProducts.find((candidate) => candidate.slug === slug)!
  return {
    id: `${slug}-${model}-${size}`,
    kind: "helmet",
    storeId: null,
    imageUrl: null,
    productSlug: slug,
    productName: product.name,
    values: { model, size, finish, film, trim, route: "new", spoiler: product.look.spoiler ? "yes" : "no", base: product.look.base },
    summary: [
      { label: "Helmet", value: model === "arai-sk6" ? "Arai SK-6" : "Bell KC7" },
      { label: "Helmet size", value: size },
      { label: "How you'd like it", value: "Supply a new helmet" },
      { label: "Base finish", value: finish === "chrome" ? "Chrome" : finish === "matte" ? "Matte" : "Gloss" },
      { label: "Rear spoiler", value: product.look.spoiler ? "Fitted" : "None" },
      { label: "Hydro-dip film", value: film },
    ],
    look: { ...product.look, finish: finish as "gloss" | "matte" | "chrome" },
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
  }
}

interface OrderSeed {
  id: string
  number: string
  customer: Profile
  status: OrderStatus
  payment: PaymentStatus
  createdAt: string
  items: OrderItem[]
  delivery: "courier" | "collection"
  notes?: string
  adminNotes?: string
}

function order(seed: OrderSeed): Order {
  const subtotal = seed.items.reduce((sum, line) => sum + line.lineTotal, 0)
  const deliveryPrice = seed.delivery === "courier" ? 12 : 0
  const events: Order["events"] = [{ id: 1, status: "pending", paymentStatus: "unpaid", note: "Order placed", createdAt: seed.createdAt }]
  if (seed.status !== "pending") {
    const sixHoursLater = new Date(Date.parse(seed.createdAt) + 6 * 60 * 60 * 1000).toISOString()
    events.push({ id: 2, status: seed.status, paymentStatus: seed.payment, note: "Proof approved by email, payment link sent.", createdAt: sixHoursLater })
  }

  return {
    id: seed.id,
    orderNumber: seed.number,
    status: seed.status,
    paymentStatus: seed.payment,
    customerName: seed.customer.fullName,
    customerEmail: seed.customer.email,
    total: subtotal + deliveryPrice,
    itemCount: seed.items.reduce((sum, line) => sum + line.quantity, 0),
    createdAt: seed.createdAt,
    userId: seed.customer.id,
    customerPhone: seed.customer.phone,
    shippingAddress:
      seed.delivery === "courier"
        ? { line1: seed.customer.addressLine1, line2: "", city: seed.customer.city, county: "", postcode: seed.customer.postcode, country: "United Kingdom" }
        : { line1: "", line2: "", city: "", county: "", postcode: "", country: "" },
    deliveryMethod: seed.delivery,
    deliveryLabel: seed.delivery === "courier" ? "Tracked UK courier" : "Collect from the workshop",
    deliveryPrice,
    subtotal,
    customerNotes: seed.notes ?? "",
    adminNotes: seed.adminNotes ?? "",
    updatedAt: events[events.length - 1].createdAt,
    items: seed.items,
    events,
  }
}

const [admin, alex, sam, jordan] = demoProfiles

export const demoOrders: Order[] = [
  order({ id: "demo-order-1006", number: "LR-1006", customer: jordan, status: "pending", payment: "unpaid", createdAt: "2026-10-13T19:20:00Z", delivery: "courier", items: [item("shard", "arai-sk6", "M", "gloss", "Carbon weave", "#111412", 954)], notes: "Number 88 please, need it before Kartmania." }),
  order({ id: "demo-order-1005", number: "LR-1005", customer: sam, status: "confirmed", payment: "paid", createdAt: "2026-10-11T11:05:00Z", delivery: "collection", items: [item("chrome-strike", "bell-kc7", "L", "chrome", "Solid colour", "#111412", 1129)] }),
  order({ id: "demo-order-1004", number: "LR-1004", customer: admin, status: "in_production", payment: "paid", createdAt: "2026-10-09T08:45:00Z", delivery: "courier", items: [item("apex", "arai-sk6", "M", "gloss", "Solid colour", "#c6f432", 899)] }),
  order({ id: "demo-order-1003", number: "LR-1003", customer: alex, status: "shipped", payment: "paid", createdAt: "2026-10-03T16:10:00Z", delivery: "courier", items: [item("twin-stripe", "arai-sk6", "S", "matte", "Solid colour", "#f4f3ee", 839), item("forged-flow", "bell-kc7", "S", "gloss", "Forged carbon", "#c6f432", 929)], adminNotes: "Second helmet is for his brother." }),
  order({ id: "demo-order-1002", number: "LR-1002", customer: admin, status: "completed", payment: "paid", createdAt: "2026-09-24T13:30:00Z", delivery: "collection", items: [item("split-tone", "bell-kc7", "M", "matte", "Solid colour", "#111412", 784)] }),
  order({ id: "demo-order-1001", number: "LR-1001", customer: alex, status: "cancelled", payment: "refunded", createdAt: "2026-09-21T09:00:00Z", delivery: "courier", items: [item("hex-halo", "arai-sk6", "L", "matte", "Hex", "#c6f432", 979)] }),
]

export const demoAdmins: AdminUser[] = [
  { role: "admin", email: demoUser.email, createdAt: "2026-09-01T09:00:00Z" },
  { role: "sales", email: "godesign.pk@gmail.com", createdAt: "2026-10-14T09:00:00Z" },
]

export function demoCustomerSummaries(): CustomerSummary[] {
  return demoProfiles.map((person) => {
    const orders = demoOrders.filter((entry) => entry.userId === person.id)
    return {
      id: person.id,
      email: person.email,
      fullName: person.fullName,
      phone: person.phone,
      city: person.city,
      postcode: person.postcode,
      createdAt: person.createdAt,
      orderCount: orders.length,
      totalSpent: orders.filter((entry) => entry.status !== "cancelled").reduce((sum, entry) => sum + entry.total, 0),
      lastOrderAt: orders[0]?.createdAt ?? null,
    }
  })
}
