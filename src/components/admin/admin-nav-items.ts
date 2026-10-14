import {
  Droplets,
  LayoutDashboard,
  MessagesSquare,
  Package,
  PoundSterling,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Shows the live count of conversations awaiting a reply. */
  unreadBadge?: boolean
}

export const adminNavSections: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Sales",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Quotes", href: "/admin/quotes", icon: Sparkles },
      { label: "Messages", href: "/admin/messages", icon: MessagesSquare, unreadBadge: true },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Films", href: "/admin/films", icon: Droplets },
      { label: "Pricing", href: "/admin/pricing", icon: PoundSterling },
    ],
  },
  {
    title: "Store",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
]

export function isAdminNavActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)
}
