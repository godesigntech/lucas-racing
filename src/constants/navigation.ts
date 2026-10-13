export interface NavItem {
  label: string
  href: string
}

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export const authNav = {
  login: { label: "Login", href: "/login" },
  signup: { label: "Sign Up", href: "/signup" },
} satisfies Record<string, NavItem>

export const legalNav: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]
