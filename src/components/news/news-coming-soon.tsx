import { ComingSoon } from "@/components/shared/coming-soon"
import { images } from "@/constants/images"

/** Shown instead of the news while it's switched off in Settings. */
export function NewsComingSoon() {
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
