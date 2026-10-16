import { TeamGrid } from "@/components/about/team-grid"
import { HomeContact } from "@/components/home/home-contact"
import { HomeCustomisation } from "@/components/home/home-customisation"
import { HomeNews } from "@/components/home/home-news"
import { HomePaddock } from "@/components/home/home-paddock"
import { HomeServices } from "@/components/home/home-services"
import { HomeTicker } from "@/components/home/home-ticker"
import { LucasHero } from "@/components/home/lucas-hero"
import { PartnerShops } from "@/components/home/partner-shops"
import { ShopCategories } from "@/components/home/shop-categories"

// The client's order: Lucas Racing, the team, MS Kart and racing support, the shop,
// customisation, racewear and teamwear, then news (once posts exist) and contact.
export default function HomePage() {
  return (
    <>
      <LucasHero />
      <HomeTicker />
      <TeamGrid
        eyebrow="The team"
        title="Howard, Connor and Wendy"
        description="Lucas Racing is a family. The experience, the support at the circuit and the welcome in the paddock all come from the people behind it."
      />
      <HomeServices />
      <HomePaddock />
      <ShopCategories />
      <HomeCustomisation />
      <PartnerShops />
      <HomeNews />
      <HomeContact />
    </>
  )
}
