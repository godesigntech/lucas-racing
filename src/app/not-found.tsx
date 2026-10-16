import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"

/**
 * Shown for unknown URLs, including inside dynamic routes. The header and footer load
 * site data, so they stream in behind simple placeholders instead of blocking the page.
 */
export default function NotFound() {
  return (
    <>
      <Suspense fallback={<HeaderPlaceholder />}>
        <SiteHeader />
      </Suspense>
      <main id="main" className="grid-texture flex flex-1 items-center bg-carbon text-paper">
        <Container className="py-24 text-center">
          <p className="eyebrow text-brand">Error 404</p>
          <h1 className="display mt-4 text-6xl sm:text-8xl">Off the track</h1>
          <p className="mx-auto mt-5 max-w-md text-paper/70">
            We couldn&apos;t find that page. It may have moved, or the link may be wrong.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                Back to home <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="/customisation">Browse helmet designs</Link>
            </Button>
          </div>
        </Container>
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </>
  )
}

function HeaderPlaceholder() {
  return (
    <header className="border-b border-carbon/10 bg-paper">
      <Container className="flex h-16 items-center lg:h-[4.5rem]">
        <Logo />
      </Container>
    </header>
  )
}
