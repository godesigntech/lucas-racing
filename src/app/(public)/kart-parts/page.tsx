import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Kart parts shop",
  description: "MS Kart and race-day parts from the Lucas Racing team, with live stock. Coming soon.",
}

export default function KartPartsPage() {
  return (
    <ComingSoon
      eyebrow="Kart parts"
      title="The Lucas Racing parts shop"
      description="MS Kart chassis parts and race-day spares, picked by a team that races every weekend."
      image={images.kartSide}
      points={[
        "MS Kart chassis parts and spares, with stock kept up to date",
        "Search by part number or browse by chassis area",
        "Order alongside your helmet and collect at the track",
        "Advice from the team on what to run and when to replace it",
      ]}
      enquiryMessage="Hi, I'm looking for kart parts. Could you help with: "
    />
  )
}
