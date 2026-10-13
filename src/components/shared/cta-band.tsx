import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { images } from "@/constants/images"

interface CtaBandProps {
  eyebrow?: string
  title?: string
  description?: string
}

export function CtaBand({
  eyebrow = "Your helmet, your colours",
  title = "Ready to put your name on the grid?",
  description = "Pick a design to start from, or tell the workshop what you have in mind. We'll send a proof before anything is painted.",
}: CtaBandProps) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-carbon text-paper">
          <Image
            src={images.kartSide.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/30" />
          <div className="relative max-w-2xl space-y-6 px-6 py-14 sm:px-12 sm:py-20">
            <p className="eyebrow text-lime">{eyebrow}</p>
            <h2 className="display text-4xl sm:text-6xl">{title}</h2>
            <p className="text-base leading-relaxed text-paper/70 sm:text-lg">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">
                  Choose a design <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="inverse">
                <Link href="/contact">Talk to the workshop</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
