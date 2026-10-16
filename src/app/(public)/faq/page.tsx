import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { CtaBand } from "@/components/shared/cta-band"
import { PageHero } from "@/components/shared/page-hero"
import { images } from "@/constants/images"

export const metadata: Metadata = {
  title: "FAQ",
  description: "How custom helmets work at Lucas Racing: designing, proofs, payment, turnaround, sending in your own helmet and delivery.",
}

const faqs: { group: string; items: { question: string; answer: React.ReactNode }[] }[] = [
  {
    group: "Designing",
    items: [
      {
        question: "How do I design my helmet?",
        answer: (
          <>
            Pick a design on the <Link href="/customisation">products page</Link> and the builder opens right there. Choose your
            helmet, finish, colours, hydro-dip film, rubber trim, and add your name, race number or logo. The preview and
            price update as you go.
          </>
        ),
      },
      {
        question: "Can I design something completely custom?",
        answer:
          "Yes. Open the design assistant (bottom right), add a photo of your helmet or an idea you like, and send it as a quote request. The workshop replies with a price and a proof.",
      },
      {
        question: "Can I save a design and come back later?",
        answer: "Yes. Log in and use “Save design” in the builder. Your designs are kept under Saved designs in your account.",
      },
      {
        question: "What are hydro-dip films?",
        answer:
          "Printed patterns (carbon, camo, wood, marble and many more) transferred onto the helmet in water, so the pattern wraps around every curve. We keep a large range in stock, and you can browse them all in the builder.",
      },
    ],
  },
  {
    group: "Ordering and payment",
    items: [
      {
        question: "Do I pay when I place my order?",
        answer:
          "No. You place your order without paying. We send you a digital proof of your exact design to approve, along with how to pay. Nothing is painted until you've signed off the proof.",
      },
      {
        question: "Do I need an account?",
        answer:
          "You can design and send quote requests without one. To place an order, save designs or chat with the workshop, create a free account so you can track everything in one place.",
      },
      {
        question: "Can I change my design after ordering?",
        answer:
          "Yes, until you approve the proof. Reply to the proof email or message us through the chat (bottom left when you're logged in) with your changes.",
      },
    ],
  },
  {
    group: "Helmets and turnaround",
    items: [
      {
        question: "Which helmets do you customise?",
        answer: "The Arai SK-6 and Bell KC7. We can supply a new helmet in your size, or customise one you already own.",
      },
      {
        question: "Can I send in my own helmet?",
        answer:
          "Yes. Choose “Send my own helmet” in the builder. Once your proof is approved we'll tell you where to post it or when to drop it off. Helmets must be in good condition, with no impact damage.",
      },
      {
        question: "How long does it take?",
        answer:
          "It depends on the design and how busy the workshop is. We confirm a finish date with your proof. Message us if you need it for a particular race.",
      },
      {
        question: "Is my helmet still safe and homologated?",
        answer:
          "We only work on the outer finish. We don't drill, cut or change the shell, liner or visor mechanism. Check your championship's rules if you're unsure about decals or finishes.",
      },
    ],
  },
  {
    group: "Delivery",
    items: [
      {
        question: "How is my helmet delivered?",
        answer: "You choose at checkout: collection from the workshop, or tracked delivery within the UK. Delivery prices are shown before you order.",
      },
      {
        question: "Do you ship outside the UK?",
        answer: (
          <>
            Get in touch through the <Link href="/contact">contact page</Link> and we&apos;ll quote international delivery.
          </>
        ),
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        description="Everything about designing, ordering and getting your custom helmet. Can't find your answer? Ask the workshop."
        image={images.teamAwning}
      />
      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl space-y-12">
          {faqs.map((group) => (
            <div key={group.group}>
              <h2 className="eyebrow mb-4 text-brand-ink">{group.group}</h2>
              <div className="divide-y divide-carbon/10 rounded-3xl border border-carbon/10 bg-card">
                {group.items.map((item) => (
                  <details key={item.question} className="group px-5 py-4 sm:px-6 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span aria-hidden className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-carbon/80">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section>
      <CtaBand eyebrow="Still wondering?" title="Talk to the workshop" description="Send us a message and the team will get back to you." />
    </>
  )
}
