import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "MS Kart shop",
  description:
    "Complete MS Kart karts, chassis, components, spares and accessories from Lucas Racing, the UK distributor of MS Kart.",
}

export default function ShopPage() {
  return (
    <ComingSoon
      eyebrow="MS Kart shop"
      title="The UK home of MS Kart"
      description="Complete karts, chassis, components, spares and accessories, from the team that has raced and supported MS Kart since 1999."
      image={images.teamAwning}
      logo={brandLogos.msKart}
      points={[
        "Complete MS Kart karts and chassis packages",
        "Chassis parts, components and race-day spares, with our own stock levels",
        "Search by part name or number, and filter by category",
        "One basket and checkout with helmets and teamwear",
      ]}
      enquiryMessage="Hi, I'm looking for MS Kart parts or a kart. Could you help with: "
    />
  )
}
