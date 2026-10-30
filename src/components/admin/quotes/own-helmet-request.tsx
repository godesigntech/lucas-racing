import { AdminCard } from "@/components/admin/admin-card"
import { ownHelmetFinishLabels, ownHelmetLacquerLabels } from "@/lib/validations/own-helmet"
import type { QuoteRequest } from "@/types/design-assistant"

const label = <T extends string>(labels: Record<T, string>, value: string) => labels[value as T] ?? value

/**
 * An own-helmet request for the workshop: every photo of the customer's helmet,
 * the choices they made (finishes, lacquer, films, text) and their logos.
 * Links are signed and last an hour; reload the page to refresh them.
 */
export function OwnHelmetRequest({ quote, photoUrls, logoUrls }: { quote: QuoteRequest; photoUrls: string[]; logoUrls: string[] }) {
  const { details } = quote
  const rows: [string, string][] = [
    ["Helmet", details.makeModel],
    ["Size", details.size],
    ["Paint finishes", details.finishes.map((finish) => label(ownHelmetFinishLabels, finish)).join(", ")],
    ["Lacquer", details.lacquer ? label(ownHelmetLacquerLabels, details.lacquer) : ""],
    ["Films", details.films.map((film) => (film.code ? `${film.name} (${film.code})` : film.name)).join(", ")],
    ["Name on helmet", details.racingName],
    ["Race number", details.racingNumber],
    ["Other text", details.extraText],
  ]

  return (
    <>
      <AdminCard title={`Photos of their helmet (${photoUrls.length})`} description="Links work for an hour; reload to refresh them.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photoUrls.map((url, index) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10 transition hover:ring-carbon/30">
                {/* Signed, short-lived link to a private photo. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${index + 1} of the customer's helmet`} className="aspect-square w-full object-cover" />
              </a>
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title="Their choices">
        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
          {rows.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">{name}</dt>
              <dd className="font-medium">{value || <span className="font-normal text-muted-foreground">None</span>}</dd>
            </div>
          ))}
        </dl>
      </AdminCard>

      {logoUrls.length > 0 && (
        <AdminCard title={`Logos (${logoUrls.length})`} description="Uploaded by the customer. Links work for an hour.">
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
