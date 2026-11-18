export const socialIcons = ["instagram", "facebook", "youtube", "tiktok", "whatsapp"] as const
export type SocialIconName = (typeof socialIcons)[number]

export interface SocialLink {
  label: string
  icon: SocialIconName
  href: string
}

export interface DeliveryMethod {
  id: string
  label: string
  description: string
  price: number
  requiresAddress: boolean
  active: boolean
}

export interface SiteSettings {
  businessName: string
  partnerName: string
  contactEmail: string
  contactPhone: string
  location: string
  addressNote: string
  openingHours: string
  eventName: string
  eventDates: string
  showEventBanner: boolean
  /** MS Kart parts by HydroKarts is public (off: admins only, until the branding is approved). */
  kartPartsLive: boolean
  /** News and results pages are on (off: a coming-soon page and no homepage section). */
  showNews: boolean
  /** The gallery is on. */
  showGallery: boolean
  /** A notice across the top of every page (e.g. "still in testing"), shown while switched on. */
  siteNotice: string
  /** Customers can place orders (off: the basket asks for a quote instead, e.g. while prices are confirmed). */
  checkoutEnabled: boolean
  showSiteNotice: boolean
  socialLinks: SocialLink[]
  deliveryMethods: DeliveryMethod[]
}
