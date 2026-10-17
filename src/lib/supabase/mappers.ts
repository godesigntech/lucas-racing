import type { Profile, CustomerSummary } from "@/types/account"
import type { ConfiguratorOption, Film, OptionGroupKey } from "@/types/catalog"
import type { FilmPattern, HelmetLook, HelmetModel } from "@/types/helmet"
import type {
  Order,
  OrderEvent,
  OrderItem,
  OrderListItem,
  OrderStatus,
  OrderSummaryLine,
  PaymentStatus,
  ShippingAddress,
} from "@/types/order"
import type { Product, ProductBadge, ProductCategoryId, ProductSpec } from "@/types/product"
import type { DeliveryMethod, SiteSettings, SocialIconName, SocialLink } from "@/types/settings"

import type {
  ConfiguratorOptionRow,
  CustomerSummaryRow,
  FilmRow,
  HelmetModelRow,
  Json,
  OrderItemRow,
  OrderRow,
  OrderStatusEventRow,
  ProductRow,
  ProfileRow,
  SiteSettingsRow,
} from "./database.types"

// Postgres numerics can arrive as strings; normalise to numbers.
const num = (value: unknown): number => (value === null || value === undefined ? 0 : Number(value))

function asObject(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function asArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : []
}

const str = (value: Json | undefined, fallback = ""): string => (typeof value === "string" ? value : fallback)

export function toHelmetModel(row: HelmetModelRow): HelmetModel {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    shortName: row.short_name,
    summary: row.summary,
    newHelmetPrice: num(row.new_helmet_price),
    sizes: row.sizes,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toFilm(row: FilmRow): Film {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    pattern: row.pattern as FilmPattern,
    textureUrl: row.texture_url,
    thumbUrl: row.thumb_url,
    widths: row.widths ?? [],
    price: num(row.price),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toOption(row: ConfiguratorOptionRow): ConfiguratorOption {
  return {
    group: row.option_group as OptionGroupKey,
    value: row.value,
    label: row.label,
    hint: row.hint,
    swatch: row.swatch,
    price: num(row.price),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toLook(value: Json | undefined): HelmetLook {
  return asObject(value) as unknown as HelmetLook
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category as ProductCategoryId,
    models: row.model_ids,
    startingPrice: row.base_price === null ? null : num(row.base_price),
    badge: (row.badge as ProductBadge | null) ?? undefined,
    features: row.features,
    specs: asArray(row.specs).map((spec) => {
      const item = asObject(spec)
      return { label: str(item.label), value: str(item.value) } satisfies ProductSpec
    }),
    look: toLook(row.look),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function toSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    businessName: row.business_name,
    partnerName: row.partner_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    location: row.location,
    addressNote: row.address_note,
    openingHours: row.opening_hours,
    eventName: row.event_name,
    eventDates: row.event_dates,
    showEventBanner: row.show_event_banner,
    kartPartsLive: row.kart_parts_live ?? false,
    showNews: row.show_news ?? true,
    showGallery: row.show_gallery ?? true,
    socialLinks: asArray(row.social_links).map((link) => {
      const item = asObject(link)
      return { label: str(item.label), icon: str(item.icon, "instagram") as SocialIconName, href: str(item.href) } satisfies SocialLink
    }),
    deliveryMethods: asArray(row.delivery_methods).map((method) => {
      const item = asObject(method)
      return {
        id: str(item.id),
        label: str(item.label),
        description: str(item.description),
        price: num(item.price),
        requiresAddress: item.requires_address !== false,
        active: item.active !== false,
      } satisfies DeliveryMethod
    }),
  }
}

export function fromSocialLinks(links: SocialLink[]): Json {
  return links.map((link) => ({ label: link.label, icon: link.icon, href: link.href }))
}

export function fromDeliveryMethods(methods: DeliveryMethod[]): Json {
  return methods.map((method) => ({
    id: method.id,
    label: method.label,
    description: method.description,
    price: method.price,
    requires_address: method.requiresAddress,
    active: method.active,
  }))
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    county: row.county,
    postcode: row.postcode,
    country: row.country,
    createdAt: row.created_at,
  }
}

export function toCustomerSummary(row: CustomerSummaryRow): CustomerSummary {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    city: row.city,
    postcode: row.postcode,
    createdAt: row.created_at,
    orderCount: num(row.order_count),
    totalSpent: num(row.total_spent),
    lastOrderAt: row.last_order_at,
  }
}

function toShippingAddress(value: Json): ShippingAddress {
  const item = asObject(value)
  return {
    line1: str(item.line1),
    line2: str(item.line2),
    city: str(item.city),
    county: str(item.county),
    postcode: str(item.postcode),
    country: str(item.country),
  }
}

/** The customer's own race number and name replace the design's sample ones in order thumbnails. */
function withPersonalisation(look: HelmetLook, values: Record<string, Json | undefined>): HelmetLook {
  const number = typeof values.raceNumber === "string" && values.raceNumber.trim() ? values.raceNumber.trim() : look.number
  const name = typeof values.riderName === "string" && values.riderName.trim() ? values.riderName.trim() : look.name
  return { ...look, number, name }
}

export function toOrderItem(row: OrderItemRow): OrderItem {
  const configuration = asObject(row.configuration)
  return {
    id: row.id,
    kind: row.line_kind === "product" ? "product" : "helmet",
    storeId: row.store_id,
    imageUrl: typeof configuration.image === "string" ? configuration.image : null,
    productSlug: row.product_slug,
    productName: row.product_name,
    values: asObject(configuration.values) as OrderItem["values"],
    summary: asArray(configuration.summary).map((line) => {
      const item = asObject(line)
      return { label: str(item.label), value: str(item.value) } satisfies OrderSummaryLine
    }),
    look: configuration.look ? withPersonalisation(toLook(configuration.look), asObject(configuration.values)) : null,
    unitPrice: num(row.unit_price),
    quantity: row.quantity,
    lineTotal: num(row.line_total),
  }
}

export function toOrderEvent(row: OrderStatusEventRow): OrderEvent {
  return {
    id: row.id,
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus | null,
    note: row.note,
    createdAt: row.created_at,
  }
}

type OrderRowWithCount = OrderRow & { order_items?: { count: number }[] | OrderItemRow[] }

export function toOrderListItem(row: OrderRowWithCount): OrderListItem {
  const items = row.order_items ?? []
  const itemCount =
    items.length > 0 && "count" in items[0] ? num((items[0] as { count: number }).count) : items.length
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    total: num(row.total),
    itemCount,
    createdAt: row.created_at,
  }
}

export function toOrder(
  row: OrderRow & { order_items: OrderItemRow[]; order_status_events: OrderStatusEventRow[] },
): Order {
  const items = row.order_items.map(toOrderItem)
  return {
    ...toOrderListItem({ ...row, order_items: row.order_items }),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    userId: row.user_id,
    customerPhone: row.customer_phone,
    shippingAddress: toShippingAddress(row.shipping_address),
    deliveryMethod: row.delivery_method,
    deliveryLabel: row.delivery_label,
    deliveryPrice: num(row.delivery_price),
    subtotal: num(row.subtotal),
    customerNotes: row.customer_notes,
    adminNotes: row.admin_notes,
    updatedAt: row.updated_at,
    items,
    events: [...row.order_status_events]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(toOrderEvent),
  }
}
