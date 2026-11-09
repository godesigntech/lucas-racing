import {
  BookOpen,
  HardHat,
  Trophy,
  Images,
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Newspaper,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import type { StaffRole } from "@/types/account"

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Shows the live count of conversations awaiting a reply. */
  unreadBadge?: boolean
  /** Hidden from Sales staff: catalogue, pricing and settings. */
  fullAdminOnly?: boolean
  /** Also shown to Teamwear staff (who see nothing else). */
  teamwear?: boolean
  /** Only for Admin and Teamwear (e.g. the Teamwear guide). */
  teamwearAndAdminOnly?: boolean
}

export const adminNavSections: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Sales",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag, teamwear: true },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Quotes", href: "/admin/quotes", icon: Sparkles },
      { label: "Competition", href: "/admin/competition", icon: Trophy },
      { label: "Messages", href: "/admin/messages", icon: MessagesSquare, unreadBadge: true },
      { label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Helmet builder", href: "/admin/builder", icon: HardHat, fullAdminOnly: true },
      { label: "Shop products", href: "/admin/shop", icon: Store, fullAdminOnly: true, teamwear: true },
      { label: "Teamwear guide", href: "/admin/teamwear-guide", icon: BookOpen, teamwearAndAdminOnly: true, teamwear: true },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "News", href: "/admin/news", icon: Newspaper, fullAdminOnly: true },
      { label: "Gallery", href: "/admin/gallery", icon: Images, fullAdminOnly: true },
      { label: "Team", href: "/admin/team", icon: UsersRound, fullAdminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, fullAdminOnly: true },
    ],
  },
]

/** The menu items a staff role can see. */
export function visibleNavItems(item: AdminNavItem, role: StaffRole | null): boolean {
  if (role === "teamwear") return Boolean(item.teamwear)
  if (role === "admin") return true
  return !item.fullAdminOnly && !item.teamwearAndAdminOnly
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  // A template's details page lives at /admin/products/[slug], inside the helmet builder.
  if (href === "/admin/builder" && pathname.startsWith("/admin/products/")) return true
  return pathname === href || pathname.startsWith(`${href}/`)
}
