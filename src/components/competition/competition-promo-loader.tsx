import { getCompetition } from "@/lib/data/competition"

import { CompetitionPromo } from "./competition-promo"

/** The competition pop-up, only while the competition is coming up or taking entries. */
export async function CompetitionPromoLoader() {
  const competition = await getCompetition()
  if (!competition || (competition.status !== "upcoming" && competition.status !== "open")) return null
  const closing = competition.closesAt
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date(competition.closesAt))
    : null
  return <CompetitionPromo competitionId={competition.id} closing={closing} />
}
