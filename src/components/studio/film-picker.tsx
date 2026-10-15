"use client"

import { useId, useMemo, useState } from "react"
import { Ban, Check, Search, X } from "lucide-react"

import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Film } from "@/types/catalog"

interface FilmPickerProps {
  films: Film[]
  value: string
  onChange: (filmId: string) => void
}

/** How many swatches show at first, and how many more each "Show more" adds. */
const PAGE = 30

/**
 * Browse the hydro-dip film library: categories, search by film code, and a
 * swatch grid that grows on demand so hundreds of films stay quick to load.
 */
export function FilmPicker({ films, value, onChange }: FilmPickerProps) {
  const searchId = useId()
  const solid = films.find((film) => !film.textureUrl)
  const library = useMemo(() => films.filter((film) => film.textureUrl), [films])
  const selected = films.find((film) => film.id === value)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const film of library) counts.set(film.category, (counts.get(film.category) ?? 0) + 1)
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [library])

  const [category, setCategory] = useState(() =>
    selected?.textureUrl ? selected.category : (categories[0]?.name ?? ""),
  )
  const [query, setQuery] = useState("")
  const [visible, setVisible] = useState(PAGE)

  const term = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      term
        ? library.filter((film) => film.code.toLowerCase().includes(term) || film.category.toLowerCase().includes(term))
        : library.filter((film) => film.category === category),
    [library, term, category],
  )
  const shown = matches.slice(0, visible)

  function chooseCategory(name: string) {
    setCategory(name)
    setQuery("")
    setVisible(PAGE)
  }

  return (
    <div className="min-w-0 space-y-4">
      {/* The current choice, large enough to see the pattern. */}
      <div className="flex items-center gap-4 rounded-2xl border border-carbon/10 bg-paper/60 p-3">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10">
          {selected?.textureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small static swatch, already sized
            <img src={selected.textureUrl} alt="" className="size-full object-cover" />
          ) : (
            <Ban className="size-6 text-muted-foreground" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{selected?.textureUrl ? selected.category : "No film"}</p>
          <p className="truncate font-semibold">{selected?.textureUrl ? selected.code : "Solid colour"}</p>
          <p className="text-xs text-muted-foreground">
            {selected?.textureUrl ? (
              <>
                Hydro-dipped onto your design
                {formatSurcharge(selected.price) && (
                  <span className="ml-1.5 font-semibold text-lime-ink">{formatSurcharge(selected.price)}</span>
                )}
              </>
            ) : (
              "Your base colour, no pattern"
            )}
          </p>
        </div>
        {solid && selected?.textureUrl && (
          <button
            type="button"
            onClick={() => onChange(solid.id)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-carbon/5 hover:text-carbon"
          >
            <X className="size-3.5" aria-hidden /> Remove
          </button>
        )}
      </div>

      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search films by code
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setVisible(PAGE)
          }}
          placeholder={`Search ${library.length} films by code, e.g. TSWD`}
          className="h-10 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {!term && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Film categories">
          {categories.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={item.name === category}
              onClick={() => chooseCategory(item.name)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                item.name === category
                  ? "border-carbon bg-carbon text-paper"
                  : "border-carbon/15 bg-card text-carbon/75 hover:border-carbon/40 hover:text-carbon",
              )}
            >
              {item.name}
              <span className={cn("tabular-nums", item.name === category ? "text-paper/60" : "text-muted-foreground")}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-carbon/15 px-4 py-8 text-center text-sm text-muted-foreground">
          No film matches &ldquo;{query}&rdquo;. Film codes are on the supplier&apos;s catalogue, e.g. TSWD2232.
        </p>
      ) : (
        <>
          {term && (
            <p className="text-xs text-muted-foreground">
              {matches.length} {matches.length === 1 ? "film" : "films"} found
            </p>
          )}
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Films">
            {shown.map((film) => {
              const checked = film.id === value
              return (
                <li key={film.id}>
                  <button
                    type="button"
                    onClick={() => onChange(film.id)}
                    aria-pressed={checked}
                    title={film.code}
                    className={cn(
                      "group relative block aspect-square w-full overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10 transition-[box-shadow,transform] hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
                      checked && "ring-2 ring-carbon ring-offset-2 ring-offset-card",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 160px static thumbnails, lazy loaded */}
                    <img src={film.thumbUrl ?? film.textureUrl ?? ""} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-carbon/70 px-1 py-0.5 text-center font-mono text-[0.55rem] text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {film.code}
                    </span>
                    {checked && (
                      <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-lime text-carbon">
                        <Check className="size-3" aria-hidden />
                      </span>
                    )}
                    <span className="sr-only">
                      {film.category} film {film.code}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {matches.length > shown.length && (
            <button
              type="button"
              onClick={() => setVisible((count) => count + PAGE * 2)}
              className="w-full rounded-full border border-carbon/15 py-2 text-sm font-medium transition-colors hover:border-carbon/40"
            >
              Show more ({matches.length - shown.length} left)
            </button>
          )}
        </>
      )}
    </div>
  )
}
