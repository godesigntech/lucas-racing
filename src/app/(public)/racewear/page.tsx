import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "Delta Racewear",
  description: "Custom Delta Racewear race suits, available through Lucas Racing.",
}

// Delta's logo and suit feed are on the way; the page stays a holding page until they arrive.
export default function RacewearPage() {
  return (
    <ComingSoon
      eyebrow="Delta Racewear"
      title="Delta Racewear, available through Lucas Racing"
      description="Custom race suits from our partners at Delta Racewear. Browse the range here, then design and order your suit with Delta."
      image={images.fatherAndSonPaddock}
      points={[
        "The full Delta Racewear suit range to browse",
        "Custom colours and designs, made by Delta",
        "Order and customise directly with Delta Racewear",
        "Sizing and suit advice from the Lucas Racing team",
      ]}
      enquiryMessage="Hi, I'm interested in a Delta Racewear suit. I'm looking for: "
    />
  )
}
