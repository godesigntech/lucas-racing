import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "MS Kart parts by HydroKarts",
  description: "Selected MS Kart parts finished in your own colours, hydro-dip films or chrome by HydroKarts.",
}

// The combined "MS Kart by HydroKarts" branding awaits the client's approval, so this page
// uses neither logo yet.
export default function CustomKartPartsPage() {
  return (
    <ComingSoon
      eyebrow="Customisation"
      title="MS Kart parts by HydroKarts"
      description="Selected MS Kart parts finished in your own colours, hydro-dip films or chrome, to match your helmet and kart."
      image={images.connor}
      points={[
        "Selected MS Kart components ready to customise",
        "The same paints, hydro-dip films and chrome as our custom helmets",
        "Match your parts to your helmet and team colours",
        "Order with your other parts in one basket",
      ]}
      enquiryMessage="Hi, I'd like a custom finish on some MS Kart parts. The parts are: "
    />
  )
}
