import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComingSoon } from "@/components/shared/coming-soon"
import { brandLogos } from "@/constants/brand"
import { images } from "@/constants/images"

// Holding pages for the shop's main categories until the MS Kart catalogue is imported.
const categories: Record<string, { title: string; description: string; points: string[] }> = {
  "complete-karts": {
    title: "Complete MS Kart karts",
    description: "Race-ready MS Kart chassis and complete kart packages, set up by a team that races every weekend.",
    points: [
      "Current MS Kart chassis for every class we support",
      "Complete packages ready to race, or rolling chassis",
      "Set-up advice and track support from the team",
      "Collection at the track or delivery across the UK",
    ],
  },
  parts: {
    title: "MS Kart parts and spares",
    description: "Chassis parts, components and race-day spares, with our own stock so you know what's on the shelf.",
    points: [
      "Chassis, steering, brakes, axles, bodywork and more",
      "Search by part name or MS Kart part number",
      "Live stock from our own shelves",
      "Order alongside teamwear and custom helmets",
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }))
}

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = categories[(await params).category]
  return category ? { title: category.title, description: category.description } : {}
}

export default function ShopCategoryPage({ params }: PageProps<"/shop/[category]">) {
  return (
    <Suspense>
      {params.then(({ category }) => (
        <CategoryHolding slug={category} />
      ))}
    </Suspense>
  )
}

function CategoryHolding({ slug }: { slug: string }) {
  const category = categories[slug]
  if (!category) notFound()
  return (
    <ComingSoon
      eyebrow="MS Kart shop"
      title={category.title}
      description={category.description}
      image={images.connor}
      logo={brandLogos.msKart}
      points={category.points}
      enquiryMessage={`Hi, I'm interested in ${category.title.toLowerCase()}. I'm looking for: `}
    />
  )
}
