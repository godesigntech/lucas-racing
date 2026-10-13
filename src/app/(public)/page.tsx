import { Benefits } from "@/components/home/benefits"
import { Categories } from "@/components/home/categories"
import { FeaturedProducts } from "@/components/home/featured-products"
import { FilmTicker } from "@/components/home/film-ticker"
import { HomeHero } from "@/components/home/home-hero"
import { ProcessSteps } from "@/components/home/process-steps"
import { Testimonials } from "@/components/home/testimonials"
import { WhyChooseUs } from "@/components/home/why-choose-us"
import { CtaBand } from "@/components/shared/cta-band"

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <FilmTicker />
      <FeaturedProducts />
      <Benefits />
      <WhyChooseUs />
      <ProcessSteps />
      <Categories />
      <Testimonials />
      <CtaBand />
    </>
  )
}
