import { TeamGrid } from "@/components/about/team-grid"
import { HomeContact } from "@/components/home/home-contact"
import { HomeCustomisation } from "@/components/home/home-customisation"
import { HomeServices } from "@/components/home/home-services"
import { LucasHero } from "@/components/home/lucas-hero"
import { PartnerShops } from "@/components/home/partner-shops"
import { ShopCategories } from "@/components/home/shop-categories"

// The client's order: Lucas Racing, the team, MS Kart and racing support, the shop,
// customisation, racewear and teamwear, then contact. News and results join above
// contact once posts exist.
export default function HomePage() {
  return (
    <>
      <LucasHero />
      <TeamGrid
        eyebrow="The team"
        title="Howard, Connor and Wendy"
        description="Lucas Racing is a family. The experience, the support at the circuit and the welcome in the paddock all come from the people behind it."
      />
      <HomeServices />
      <ShopCategories />
      <HomeCustomisation />
      <PartnerShops />
      <HomeContact />
    </>
  )
}
