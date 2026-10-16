import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Wendy's Teamwear",
  description: "Lucas Racing team hoodies, sweatshirts, T-shirts, polo shirts and merchandise from Wendy's Teamwear shop.",
}

export default function TeamwearPage() {
  return (
    <ComingSoon
      eyebrow="Wendy's Teamwear"
      title="Wear the team colours"
      description="Lucas Racing hoodies, sweatshirts, T-shirts, polo shirts and merchandise, looked after by Wendy."
      image={images.wendy}
      points={[
        "Team hoodies and sweatshirts",
        "T-shirts and polo shirts in every size",
        "Caps, accessories and merchandise",
        "Order with your karting kit in one basket",
      ]}
      enquiryMessage="Hi Wendy, I'm interested in Lucas Racing teamwear. I'm looking for: "
    />
  )
}
