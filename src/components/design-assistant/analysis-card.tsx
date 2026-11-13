import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { TemplatePicture } from "@/components/helmet/template-picture"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DesignAnalysis } from "@/types/design-assistant"

/** The concept in words, with the colours it uses. */
export function ConceptDetails({ analysis }: { analysis: DesignAnalysis }) {
  return (
    <div className="space-y-3">
      <p className="eyebrow text-brand-ink">Your concept</p>
      <p className="text-sm leading-relaxed">{analysis.summary}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Colours in this concept">
        {analysis.palette.map((colour) => (
          <li key={colour.hex} className="flex items-center gap-1.5 rounded-full bg-carbon/[0.05] py-1 pl-1 pr-2.5 text-xs">
            <span className="size-4 rounded-full ring-1 ring-carbon/15" style={{ backgroundColor: colour.hex }} aria-hidden />
            {colour.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Templates from our range closest to the concept, each opening in the 3D builder. */
export function MatchingTemplates({ analysis, onNavigate }: { analysis: DesignAnalysis; onNavigate?: () => void }) {
  if (analysis.suggestions.length === 0) return null
  return (
    <section aria-labelledby="matching-templates" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow text-brand-ink">From our range</p>
          <h2 id="matching-templates" className="font-display text-3xl font-bold uppercase leading-none">
            Templates that match your concept
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Opens in the 3D builder with the closest colours we offer.</p>
      </div>
      <ul className={cn("grid gap-4 sm:grid-cols-2", analysis.suggestions.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {analysis.suggestions.map((suggestion, index) => (
          <li key={suggestion.slug}>
            <Link
              href={suggestion.builderHref ?? `/helmet-builder?template=${suggestion.slug}`}
              onClick={onNavigate}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.45)]"
            >
              <span className="relative grid aspect-square place-items-center bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_80%)] p-6">
                <TemplatePicture slug={suggestion.slug} name={suggestion.name} look={suggestion.look} />
                {index === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-carbon px-2.5 py-1 text-[0.65rem] font-semibold text-paper">Closest match</span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1 p-4">
                <span className="font-display text-xl font-bold uppercase leading-tight">{suggestion.name}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{suggestion.reason}</span>
                <span className="mt-auto flex items-center justify-between pt-2 text-sm">
                  <span className="font-semibold">{formatPrice(suggestion.startingPrice)}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand-ink">
                    Try it <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
