"use client"

import Link from "next/link"
import { ArrowRight, RotateCcw, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { ConfigSummaryLine } from "@/types/configurator"

interface ConfigurationSummaryProps {
  summary: ConfigSummaryLine[]
  startingPrice: number | null
  enquiryHref: string
  canReset: boolean
  onReset: () => void
}

export function ConfigurationSummary({
  summary,
  startingPrice,
  enquiryHref,
  canReset,
  onReset,
}: ConfigurationSummaryProps) {
  return (
    <div className="space-y-5 rounded-3xl bg-carbon p-6 text-paper">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-lime">Your build</p>
          <p className="mt-2 font-display text-3xl font-bold uppercase">{formatPrice(startingPrice)}</p>
        </div>
        <Button variant="inverse" size="sm" onClick={onReset} disabled={!canReset}>
          <RotateCcw /> Reset
        </Button>
      </div>

      <dl className="divide-y divide-white/10 border-y border-white/10 text-sm">
        {summary.map((line) => (
          <div key={line.key} className="flex justify-between gap-4 py-2.5">
            <dt className="text-paper/55">{line.label}</dt>
            <dd className="text-right font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs leading-relaxed text-paper/55">
        Chrome, spoiler and a supplied helmet are priced on top. Your final price comes with the proof you approve.
      </p>

      <div className="grid gap-3">
        <Button asChild size="lg">
          <Link href={enquiryHref}>
            Enquire about this build <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="inverse">
          <Link href="/signup">
            <UserPlus /> Create an account to save designs
          </Link>
        </Button>
      </div>
    </div>
  )
}
