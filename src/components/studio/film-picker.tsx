"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Ban, Check, Search, X } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatSurcharge } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Film } from "@/types/catalog"

interface FilmPickerProps {
  films: Film[]
  value: string
  onChange: (filmId: string) => void
}

const ALL = "all"
/** Cards shown at first; more load as the list is scrolled. */
const PAGE = 24

/**
 * Browse the hydro-dip film library: search by code, filter by category, and a
 * scrolling grid of film cards that loads more as you go, so hundreds of films stay quick.
 */
export function FilmPicker({ films, value, onChange }: FilmPickerProps) {
  const searchId = useId()
  const categoryId = useId()
  const solid = films.find((film) => !film.textureUrl)
  const library = useMemo(() => films.filter((film) => film.textureUrl), [films])
  const selected = films.find((film) => film.id === value)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const film of library) counts.set(film.category, (counts.get(film.category) ?? 0) + 1)
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [library])

  const [category, setCategory] = useState(ALL)
  const [query, setQuery] = useState("")
  const [visible, setVisible] = useState(PAGE)
  const scroller = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)

  const term = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      library.filter(
        (film) =>
          (category === ALL || film.category === category) &&
          (!term || film.code.toLowerCase().includes(term) || film.category.toLowerCase().includes(term)),
      ),
    [library, category, term],
  )
  const shown = matches.slice(0, visible)
  const hasMore = matches.length > shown.length

  // Load the next batch when the bottom of the list scrolls into view.
  useEffect(() => {
    const root = scroller.current
    const target = sentinel.current
    if (!root || !target || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible((count) => count + PAGE)
      },
      { root, rootMargin: "200px" },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, shown.length])

  function resetList() {
    setVisible(PAGE)
    scroller.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="min-w-0 space-y-3">
      {/* Current choice */}
      <div className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-paper/60 p-2 pr-3">
        <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-carbon/5 ring-1 ring-carbon/10">
          {selected?.textureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small static swatch
            <img src={selected.thumbUrl ?? selected.textureUrl} alt="" className="size-full object-cover" />
          ) : (
            <Ban className="size-4 text-muted-foreground" aria-hidden />
          )}
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="block text-xs text-muted-foreground">Selected film</span>
          <span className="block truncate font-semibold">
            {selected?.textureUrl ? `${selected.code} · ${selected.category}` : "None, solid colour"}
          </span>
        </p>
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

      {/* Search and category, side by side */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search films
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetList()
            }}
            placeholder={`Search ${library.length} films…`}
            className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div>
          <label htmlFor={categoryId} className="sr-only">
            Film category
          </label>
          <Select
            value={category}
            onValueChange={(next) => {
              setCategory(next)
              resetList()
            }}
          >
            <SelectTrigger id={categoryId} className="h-11 w-full rounded-xl bg-card">
              <SelectValue>{category === ALL ? "All categories" : category}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories ({library.length})</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.name} value={item.name}>
                  {item.name} ({item.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scrolling grid of film cards */}
      <div
        ref={scroller}
        className="max-h-[26rem] overflow-y-auto overscroll-contain rounded-xl border border-carbon/10 bg-paper/40 p-2"
      >
        {matches.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No films match &ldquo;{query}&rdquo;. Try a film code like TSWD or another category.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Films">
            {shown.map((film) => {
              const checked = film.id === value
              const surcharge = formatSurcharge(film.price)
              return (
                <li key={film.id}>
                  <button
                    type="button"
                    onClick={() => onChange(film.id)}
                    aria-pressed={checked}
                    className={cn(
                      "group flex w-full flex-col overflow-hidden rounded-lg border bg-card text-left transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      checked ? "border-carbon ring-1 ring-carbon" : "border-carbon/10 hover:border-carbon/35 hover:shadow-sm",
                    )}
                  >
                    <span className="relative block p-1.5 pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 160px static thumbnails, lazy loaded */}
                      <img
                        src={film.thumbUrl ?? film.textureUrl ?? ""}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-[2.2/1] w-full rounded-md object-cover"
                      />
                      {checked && (
                        <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand text-carbon shadow-sm">
                          <Check className="size-3" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="block min-w-0 px-2 pb-2 pt-1.5">
                      <span className="block truncate text-xs font-semibold">{film.code}</span>
                      <span className="flex items-center justify-between gap-1 text-[0.7rem] text-muted-foreground">
                        <span>{surcharge || "Included"}</span>
                        {category === ALL && <span className="truncate">{film.category}</span>}
                      </span>
                    </span>
                    <span className="sr-only">
                      {film.category} film {film.code}
                      {checked && ", selected"}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {hasMore && (
          <div ref={sentinel} className="py-3 text-center text-xs text-muted-foreground">
            Loading more films…
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {shown.length} of {matches.length} {matches.length === 1 ? "film" : "films"}
      </p>
    </div>
  )
}
