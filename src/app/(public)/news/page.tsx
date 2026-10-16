import type { Metadata } from "next"

import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "News and results",
  description: "Race reports, results and news from the Lucas Racing team.",
}

export default function NewsPage() {
  return (
    <ComingSoon
      eyebrow="News and results"
      title="From the paddock"
      description="Race weekend reports, results and news from the Lucas Racing team."
      image={images.fatherAndSon}
      points={[
        "Race reports from every weekend",
        "Results for our drivers, class by class",
        "Team news, new drivers and MS Kart updates",
        "Dates for test days and events",
      ]}
      enquiryMessage="Hi, I'd like to know more about racing with Lucas Racing: "
    />
  )
}
