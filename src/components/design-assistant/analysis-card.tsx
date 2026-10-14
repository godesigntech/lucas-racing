import Link from "next/link"
import { ArrowRight, FileText, RotateCcw } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { DesignAnalysis } from "@/types/design-assistant"

interface AnalysisCardProps {
  analysis: DesignAnalysis
  /** Hide the next-step buttons once the customer has moved on to the quote form. */
  showActions: boolean
  onQuote: () => void
  onRestart: () => void
  onNavigate: () => void
}

/** The concept, the colours it uses, and the closest designs from the catalogue. */
export function AnalysisCard({ analysis, showActions, onQuote, onRestart, onNavigate }: AnalysisCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-carbon/10 bg-card">
      <div className="bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_70%)] px-6 pt-5 pb-3">
        <p className="eyebrow text-lime-ink">Your concept</p>
        <HelmetArt look={analysis.concept} title="Concept helmet in your colours" className="mx-auto mt-1 max-h-48" />
      </div>

      <div className="space-y-4 p-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Colours in this concept">
          {analysis.palette.map((colour) => (
            <li key={colour.hex} className="flex items-center gap-1.5 rounded-full bg-carbon/[0.05] py-1 pl-1 pr-2.5 text-xs">
              <span className="size-4 rounded-full ring-1 ring-carbon/15" style={{ backgroundColor: colour.hex }} aria-hidden />
              {colour.name}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed">{analysis.summary}</p>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closest designs</h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion) => (
              <li key={suggestion.slug}>
                <Link
                  href={suggestion.builderHref ?? `/products/${suggestion.slug}`}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-2xl border border-carbon/10 p-2 transition-colors hover:border-carbon/30 hover:bg-carbon/[0.02]"
                >
                  <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] p-1.5">
                    <HelmetArt look={suggestion.look} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold uppercase leading-tight">{suggestion.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{suggestion.reason}</span>
                    <span className="mt-0.5 block text-xs font-semibold">{formatPrice(suggestion.startingPrice)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 pr-1 text-xs font-semibold text-carbon">
                    <span className="max-[380px]:sr-only">Try it</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.7rem] text-muted-foreground">
            &ldquo;Try it&rdquo; opens the design in the builder with the closest colours we offer.
          </p>
        </div>

        {showActions && (
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={onQuote}>
              <FileText aria-hidden /> Get a quote for this concept
            </Button>
            <Button variant="ghost" onClick={onRestart}>
              <RotateCcw aria-hidden /> Start again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
