export interface NavItem {
  label: string
  href: string
  /** One line shown under the label in dropdown menus. */
  description?: string
}

export interface NavGroup extends NavItem {
  /** Shown as a dropdown on desktop and an indented list on mobile. */
  children?: NavItem[]
}

/** The client's top-level menu, details in dropdowns. */
export const mainNav: NavGroup[] = [
  {
    label: "About Us",
    href: "/about",
    children: [
      { label: "About Lucas Racing", href: "/about", description: "A family-run racing team since day one" },
      { label: "Meet the team", href: "/team", description: "Howard, Connor, Wendy and the people behind the team" },
      { label: "Racing support", href: "/about/racing-support", description: "Coaching, race weekends and driver development" },
      { label: "News and results", href: "/news", description: "What's happening at Lucas Racing" },
      { label: "Gallery", href: "/gallery", description: "Race weekends, the team and the paddock" },
    ],
  },
  {
    label: "MS Kart Shop",
    href: "/shop",
    children: [
      { label: "Shop all", href: "/shop", description: "Karts, parts and accessories from the UK home of MS Kart" },
      { label: "Prokart", href: "/shop/prokart", description: "Race-ready MS Kart complete karts" },
      { label: "Spare parts", href: "/shop/spare-parts", description: "Chassis parts, components and race-day spares" },
    ],
  },
  {
    label: "Customisation",
    href: "/customisation",
    children: [
      { label: "Customisation by HydroKarts", href: "/customisation", description: "Helmets and kart parts in your own finish" },
      { label: "Custom helmets", href: "/customisation/helmets", description: "Arai SK-6 and Bell KC7 designs by HydroKarts" },
      { label: "Helmet builder", href: "/helmet-builder", description: "Design yours step by step, in 3D" },
      { label: "MS Kart parts by HydroKarts", href: "/customisation/kart-parts", description: "Kart parts in your own finish" },
    ],
  },
  { label: "Racewear", href: "/racewear" },
  { label: "Teamwear", href: "/teamwear" },
  { label: "Contact", href: "/contact" },
]

/** Footer columns. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Lucas Racing",
    items: [
      { label: "About us", href: "/about" },
      { label: "Meet the team", href: "/team" },
      { label: "Racing support", href: "/about/racing-support" },
      { label: "News and results", href: "/news" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Shop",
    items: [
      { label: "MS Kart shop", href: "/shop" },
      { label: "Custom helmets", href: "/customisation/helmets" },
      { label: "MS Kart parts by HydroKarts", href: "/customisation/kart-parts" },
      { label: "Delta Racewear", href: "/racewear" },
      { label: "Wendy's Teamwear", href: "/teamwear" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Contact us", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "My account", href: "/account" },
      { label: "Basket", href: "/basket" },
    ],
  },
]

export const authNav = {
  login: { label: "Login", href: "/login" },
  signup: { label: "Sign Up", href: "/signup" },
} satisfies Record<string, NavItem>

export const legalNav: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]
