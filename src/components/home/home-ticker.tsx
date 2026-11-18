const items = [
  "UK home of MS Kart",
  "Le Mans 24 Hours winners",
  "Racing support",
  "Kart preparation and setup",
  "Custom helmets by HydroKarts",
  "Delta Racewear",
  "Family run since 1999",
]

/** An orange strip of what the team does, scrolling under the hero (kept level: the client prefers no angles). */
export function HomeTicker() {
  const loop = [...items, ...items]
  return (
    <div className="relative z-10 overflow-hidden py-5">
      <div className="border-y-2 border-carbon bg-brand py-3.5 text-carbon">
        <p className="sr-only">{items.join(", ")}</p>
        <ul aria-hidden className="flex w-max animate-marquee gap-10 pr-10 hover:[animation-play-state:paused]">
          {loop.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center gap-10 font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
              {item}
              <span className="chequer size-4 shrink-0 rounded-[2px]" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
