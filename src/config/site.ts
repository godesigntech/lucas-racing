// Contact details below are placeholders until Lucas Racing supplies the real ones.
export const siteConfig = {
  name: "Lucas Racing",
  partner: "Hydro Karts",
  title: "Lucas Racing × Hydro Karts | Custom race helmets",
  description:
    "Custom Arai SK-6 and Bell KC7 race helmets from the Lucas Racing team: racing-line designs, hydro-dip films and in-house chrome, finished by Hydro Karts in the UK.",
  url: "https://lucasracing.co.uk",
  copyrightYear: 2026,
  event: {
    name: "Kartmania",
    dates: "14–15 November 2026",
  },
  contact: {
    email: "hello@lucasracing.co.uk",
    phone: "+44 (0)1642 000 000",
    location: "North East England",
    addressNote: "Workshop address to be confirmed",
    hours: "Mon–Fri, 9:00–17:30",
  },
  social: [
    { label: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
    { label: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
    { label: "YouTube", href: "https://www.youtube.com/", icon: "youtube" },
    { label: "TikTok", href: "https://www.tiktok.com/", icon: "tiktok" },
  ],
} as const

export type SocialIcon = (typeof siteConfig.social)[number]["icon"]
