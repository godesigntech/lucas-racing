import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MessagesSquare, PackageCheck, Palette } from "lucide-react"

import { Logo } from "@/components/layout/logo"
import { images } from "@/constants/images"

const perks = [
  { icon: PackageCheck, text: "Order MS Kart parts, teamwear and custom helmets in one basket" },
  { icon: MessagesSquare, text: "Chat with the team and track every order" },
  { icon: Palette, text: "Save your helmet designs and come back to them" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Logo preload />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-carbon"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </main>
      </div>

      <aside className="relative isolate hidden overflow-hidden bg-carbon p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <Image src={images.teamPhoto.src} alt="" fill sizes="50vw" className="-z-20 object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-carbon/60 via-carbon/70 to-carbon" />
        <p className="eyebrow relative text-brand">Your Lucas Racing account</p>
        <div className="relative max-w-md space-y-3">
          <p className="display text-5xl">Join the Lucas Racing family</p>
          <p className="text-paper/75">
            A family-run kart racing team and the UK home of MS Kart, from Oldham, Greater Manchester.
          </p>
        </div>
        <ul className="relative space-y-4">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-paper/80">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-brand">
                <Icon className="size-4" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
