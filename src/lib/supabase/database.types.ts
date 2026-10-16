// Database types for the tables in supabase/migrations.
// Keep in sync with the SQL when the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Timestamps = { created_at: string; updated_at: string }

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type Table<
  Row,
  Required extends keyof Row,
  Optional extends keyof Row = never,
  Relationships extends Relationship[] = [],
> = {
  Row: Row
  Insert: Pick<Row, Required> & Partial<Pick<Row, Optional>>
  Update: Partial<Row>
  Relationships: Relationships
}

type OrderRelationship<Name extends string> = {
  foreignKeyName: Name
  columns: ["order_id"]
  isOneToOne: false
  referencedRelation: "orders"
  referencedColumns: ["id"]
}

export type SiteSettingsRow = {
  id: number
  business_name: string
  partner_name: string
  contact_email: string
  contact_phone: string
  location: string
  address_note: string
  opening_hours: string
  event_name: string
  event_dates: string
  show_event_banner: boolean
  social_links: Json
  delivery_methods: Json
  updated_at: string
}

export type HelmetModelRow = Timestamps & {
  id: string
  brand: string
  name: string
  short_name: string
  summary: string
  new_helmet_price: number
  sizes: string[]
  is_active: boolean
  sort_order: number
}

export type ProductRow = Timestamps & {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  model_ids: string[]
  base_price: number | null
  badge: string | null
  features: string[]
  specs: Json
  look: Json
  is_active: boolean
  sort_order: number
}

export type FilmRow = Timestamps & {
  id: string
  name: string
  code: string
  category: string
  pattern: string
  texture_url: string | null
  thumb_url: string | null
  widths: string[]
  price: number
  is_active: boolean
  sort_order: number
}

export type ConfiguratorOptionRow = {
  option_group: string
  value: string
  label: string
  hint: string | null
  swatch: string | null
  price: number
  is_active: boolean
  sort_order: number
  updated_at: string
}

export type ProfileRow = Timestamps & {
  id: string
  email: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  county: string
  postcode: string
  country: string
}

export type AdminUserRow = {
  email: string
  role: string
  created_at: string
  created_by: string | null
}

export type ContactMessageRow = Timestamps & {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  topic: string
  design: string
  message: string
  status: string
  admin_notes: string
}

export type SavedDesignRow = Timestamps & {
  id: string
  user_id: string
  product_slug: string
  name: string
  config: Json
}

export type OrderRow = Timestamps & {
  id: string
  order_number: string
  user_id: string | null
  status: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: Json
  delivery_method: string
  delivery_label: string
  delivery_price: number
  subtotal: number
  total: number
  customer_notes: string
  admin_notes: string
}

export type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  product_slug: string
  product_name: string
  configuration: Json
  unit_price: number
  quantity: number
  line_total: number
  created_at: string
  line_kind: string
  store_id: string | null
  shop_variant_id: string | null
}

export type OrderStatusEventRow = {
  id: number
  order_id: string
  status: string
  payment_status: string | null
  note: string
  created_by: string | null
  created_at: string
}

export type CustomerSummaryRow = {
  id: string
  email: string
  full_name: string
  phone: string
  city: string
  postcode: string
  created_at: string
  order_count: number
  total_spent: number
  last_order_at: string | null
}

export type ConversationRow = Timestamps & {
  id: string
  customer_id: string
  status: string
  last_message_at: string | null
  last_message_preview: string
  last_message_role: string | null
  customer_unread_count: number
  admin_unread_count: number
}

export type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_role: string
  body: string
  attachment_path: string | null
  created_at: string
}

export type QuoteRequestRow = Timestamps & {
  id: string
  reference: string
  user_id: string | null
  name: string
  email: string
  phone: string
  helmet: string
  notes: string
  image_path: string | null
  palette: string[]
  concept: Json
  suggested_products: string[]
  status: string
  admin_notes: string
}

export type TeamMemberRow = Timestamps & {
  id: string
  name: string
  role: string
  tagline: string
  bio: string
  photo_url: string | null
  photo_alt: string
  featured: boolean
  is_active: boolean
  sort_order: number
}

export type StoreRow = {
  id: string
  name: string
  description: string
  purchasable: boolean
  sort_order: number
}

export type ShopCategoryRow = Timestamps & {
  id: string
  store_id: string
  parent_id: string | null
  name: string
  slug: string
  description: string
  image_url: string | null
  is_active: boolean
  sort_order: number
}

export type ShopProductRow = Timestamps & {
  id: string
  store_id: string
  category_id: string | null
  slug: string
  title: string
  brand: string
  description: string
  specs: Json
  images: string[]
  option_names: string[]
  source: string
  external_id: string | null
  external_url: string | null
  is_active: boolean
  featured: boolean
  customisable: boolean
  sort_order: number
}

export type ShopVariantRow = Timestamps & {
  id: string
  product_id: string
  sku: string | null
  option_values: Json
  price: number
  compare_at_price: number | null
  stock_quantity: number
  track_stock: boolean
  allow_backorder: boolean
  weight_grams: number | null
  is_active: boolean
  sort_order: number
}

export type InventoryMovementRow = {
  id: number
  variant_id: string
  change: number
  quantity_after: number
  reason: string
  order_id: string | null
  note: string
  created_by: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      site_settings: Table<SiteSettingsRow, never, keyof SiteSettingsRow>
      helmet_models: Table<HelmetModelRow, "id" | "brand" | "name" | "short_name", keyof HelmetModelRow>
      products: Table<ProductRow, "slug" | "name" | "category" | "look", keyof ProductRow>
      films: Table<FilmRow, "id" | "name" | "pattern", keyof FilmRow>
      configurator_options: Table<ConfiguratorOptionRow, "option_group" | "value" | "label", keyof ConfiguratorOptionRow>
      profiles: Table<ProfileRow, "id" | "email", keyof ProfileRow>
      admin_users: Table<AdminUserRow, "email", keyof AdminUserRow>
      orders: Table<OrderRow, "customer_name" | "customer_email" | "delivery_method" | "delivery_label" | "subtotal" | "total", keyof OrderRow>
      order_items: Table<
        OrderItemRow,
        "order_id" | "product_slug" | "product_name" | "configuration" | "unit_price" | "quantity" | "line_total",
        keyof OrderItemRow,
        [OrderRelationship<"order_items_order_id_fkey">]
      >
      order_status_events: Table<
        OrderStatusEventRow,
        "order_id" | "status",
        keyof OrderStatusEventRow,
        [OrderRelationship<"order_status_events_order_id_fkey">]
      >
      conversations: Table<
        ConversationRow,
        "customer_id",
        keyof ConversationRow,
        [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      >
      messages: Table<
        MessageRow,
        "conversation_id" | "sender_role",
        keyof MessageRow,
        [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      >
      quote_requests: Table<QuoteRequestRow, "name" | "email" | "helmet", keyof QuoteRequestRow>
      contact_messages: Table<ContactMessageRow, "name" | "email" | "topic" | "message", keyof ContactMessageRow>
      saved_designs: Table<SavedDesignRow, "product_slug" | "name" | "config", keyof SavedDesignRow>
      team_members: Table<TeamMemberRow, "name", keyof TeamMemberRow>
      stores: Table<StoreRow, "id" | "name", keyof StoreRow>
      shop_categories: Table<
        ShopCategoryRow,
        "store_id" | "name" | "slug",
        keyof ShopCategoryRow,
        [
          {
            foreignKeyName: "shop_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      >
      shop_products: Table<
        ShopProductRow,
        "store_id" | "slug" | "title",
        keyof ShopProductRow,
        [
          {
            foreignKeyName: "shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      >
      shop_variants: Table<
        ShopVariantRow,
        "product_id" | "price",
        keyof ShopVariantRow,
        [
          {
            foreignKeyName: "shop_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      >
      inventory_movements: Table<
        InventoryMovementRow,
        "variant_id" | "change" | "quantity_after" | "reason",
        keyof InventoryMovementRow,
        [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "shop_variants"
            referencedColumns: ["id"]
          },
        ]
      >
    }
    Views: {
      customer_summaries: { Row: CustomerSummaryRow; Relationships: [] }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_full_admin: { Args: Record<string, never>; Returns: boolean }
      set_variant_stock: { Args: { p_variant_id: string; p_quantity: number; p_note?: string }; Returns: number }
      submit_contact_message: {
        Args: { p_name: string; p_email: string; p_phone: string; p_topic: string; p_design: string; p_message: string }
        Returns: string
      }
      mark_conversation_read: { Args: { p_conversation_id: string; p_role: string }; Returns: undefined }
      submit_quote_request: {
        Args: {
          p_name: string
          p_email: string
          p_phone: string
          p_helmet: string
          p_notes: string
          p_image_path: string | null
          p_palette: string[]
          p_concept: Json
          p_suggested_products: string[]
        }
        Returns: { reference: string }[]
      }
      place_order: {
        Args: {
          p_items: Json
          p_customer: Json
          p_shipping: Json
          p_delivery_method: string
          p_notes?: string
        }
        Returns: { order_id: string; order_number: string }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
