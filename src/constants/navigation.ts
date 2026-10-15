export interface NavItem {
  label: string
  href: string
}

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
]

/** Sections launching after the helmet builder; each has a holding page. */
export const comingSoonNav: NavItem[] = [
  { label: "Kart parts", href: "/kart-parts" },
  { label: "Kart customiser", href: "/kart-customiser" },
  { label: "Racewear", href: "/racewear" },
]

export const authNav = {
  login: { label: "Login", href: "/login" },
  signup: { label: "Sign Up", href: "/signup" },
} satisfies Record<string, NavItem>

export const legalNav: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]
