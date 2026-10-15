import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Racewear",
  description: "Delta Racewear suits, gloves and team kit, chosen to go with your custom helmet. Coming soon.",
}

export default function RacewearPage() {
  return (
    <ComingSoon
      eyebrow="Racewear"
      title="Delta Racewear collection"
      description="Race suits, gloves and team kit from Delta Racewear, chosen to go with your custom helmet."
      image={images.driverHelmet}
      points={[
        "Delta Racewear suits, gloves and boots",
        "Team kit in the same colours as your helmet",
        "Sizing help from the team",
        "Order with your helmet in one basket",
      ]}
      enquiryMessage="Hi, I'm interested in Delta Racewear. I'm looking for: "
    />
  )
}
