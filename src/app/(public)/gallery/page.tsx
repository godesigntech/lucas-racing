import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of the Lucas Racing team, race weekends, the paddock and our drivers.",
}

export default function GalleryPage() {
  return (
    <ComingSoon
      eyebrow="Gallery"
      title="Life in the paddock"
      description="Race weekends, the team at work and our drivers on track."
      image={images.teamPhoto}
      points={[
        "Albums from every race weekend",
        "The team, the mechanics and the awning",
        "Our drivers on and off track",
        "Coaching days and test sessions",
      ]}
      enquiryMessage="Hi, I have a question for the Lucas Racing team: "
    />
  )
}
