import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Kart customiser",
  description: "Design your kart's bodywork and stickers in team colours to match your helmet. Coming soon.",
}

export default function KartCustomiserPage() {
  return (
    <ComingSoon
      eyebrow="Kart customiser"
      title="Make your kart match your lid"
      description="Design your kart's bodywork in the same colours as your helmet, then let the workshop print and fit it."
      image={images.kartGrid}
      points={[
        "Choose textures and colours for nose cone, side pods and front panel",
        "Add your race number and name in matching fonts",
        "Preview the whole kart before you order",
        "Kits printed and finished by the Hydro Karts workshop",
      ]}
      enquiryMessage="Hi, I'd like custom kart bodywork to match my helmet. My kart is a: "
    />
  )
}
