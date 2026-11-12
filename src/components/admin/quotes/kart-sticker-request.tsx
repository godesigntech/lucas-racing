import { Download } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { Button } from "@/components/ui/button"
import { findKartLayout, kartFinishLabels, type KartFinish } from "@/lib/kart-stickers/options"
import type { QuoteRequest } from "@/types/design-assistant"

/**
 * A kart sticker kit the customer designed with AI: the design itself (full size), what
 * they asked for, and their logos to use in the print files.
 */
export function KartStickerRequest({ quote, designUrl, logoUrls }: { quote: QuoteRequest; designUrl: string | null; logoUrls: string[] }) {
  const kart = quote.kart
  const layout = findKartLayout(kart?.layout)
  const rows: [string, string][] = [
    ["Kart", kart?.kartModel ?? ""],
    ["Layout", layout ? (layout.parts ? `${layout.name} (${layout.parts})` : layout.name) : (kart?.layout ?? "")],
    ["Finish", kartFinishLabels[kart?.finish as KartFinish]?.label ?? kart?.finish ?? ""],
    ["Race number", kart?.raceNumber ?? ""],
    ["Driver name", kart?.driverName ?? ""],
  ]

  return (
    <>
      <AdminCard
        title="Their kart sticker design"
        description="Made by the AI on the blank layout from their brief. Links work for an hour; reload to refresh them."
        action={
          designUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={designUrl} target="_blank" rel="noreferrer" download>
                <Download aria-hidden /> Full size
              </a>
            </Button>
          ) : undefined
        }
        flush
      >
        {designUrl ? (
          <a href={designUrl} target="_blank" rel="noreferrer" className="block bg-paper">
            {/* Signed, short-lived link to the private design picture. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={designUrl} alt={`Kart sticker design for ${quote.reference}`} className="mx-auto max-h-[36rem] w-full object-contain" />
          </a>
        ) : (
          <p className="px-5 py-16 text-center text-sm text-muted-foreground">The design picture couldn&apos;t be loaded.</p>
        )}
      </AdminCard>

      <AdminCard title="What they asked for">
        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Design brief</dt>
          <dd className="whitespace-pre-line">{kart?.prompt || <span className="text-muted-foreground">None</span>}</dd>
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">{name}</dt>
              <dd className="font-medium">{value || <span className="font-normal text-muted-foreground">None</span>}</dd>
            </div>
          ))}
        </dl>
      </AdminCard>

      {logoUrls.length > 0 && (
        <AdminCard title={`Their logos (${logoUrls.length})`} description="The originals they uploaded, for the print files. Links work for an hour.">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {logoUrls.map((url, index) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl border border-carbon/10 p-2 transition-colors hover:border-carbon/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Logo ${index + 1}`} className="aspect-square w-full rounded-lg bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain" />
                </a>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </>
  )
}
