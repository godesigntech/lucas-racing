import {
  Droplets,
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Newspaper,
  Package,
  PoundSterling,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Shows the live count of conversations awaiting a reply. */
  unreadBadge?: boolean
  /** Hidden from Sales staff: catalogue, pricing and settings. */
  fullAdminOnly?: boolean
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
      { label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Shop products", href: "/admin/shop", icon: Store, fullAdminOnly: true },
      { label: "Helmet designs", href: "/admin/products", icon: Package, fullAdminOnly: true },
      { label: "Films", href: "/admin/films", icon: Droplets, fullAdminOnly: true },
      { label: "Pricing", href: "/admin/pricing", icon: PoundSterling, fullAdminOnly: true },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "News", href: "/admin/news", icon: Newspaper, fullAdminOnly: true },
      { label: "Team", href: "/admin/team", icon: UsersRound, fullAdminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, fullAdminOnly: true },
    ],
  },
]

export function isAdminNavActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)
}
