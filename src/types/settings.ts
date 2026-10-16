export const socialIcons = ["instagram", "facebook", "youtube", "tiktok"] as const
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
  socialLinks: SocialLink[]
  deliveryMethods: DeliveryMethod[]
}
