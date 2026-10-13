const items = [
  "Carbon weave",
  "Forged carbon",
  "Hex",
  "Camo",
  "Mirror chrome",
  "Candy tints",
  "Matte lacquer",
  "Gloss lacquer",
  "Custom-printed film",
]

/** Lime ticker strip listing finishes. Pauses for reduced-motion users via global CSS. */
export function FilmTicker() {
  const loop = [...items, ...items]
  return (
    <div className="overflow-hidden border-y border-carbon/10 bg-lime py-3 text-carbon" aria-label="Finishes we offer">
      <ul className="flex w-max animate-marquee gap-8 pr-8">
        {loop.map((item, index) => (
          <li
            key={`${item}-${index}`}
            aria-hidden={index >= items.length}
            className="flex items-center gap-8 font-display text-xl font-bold uppercase tracking-wide"
          >
            {item}
            <span className="size-2 rotate-45 bg-carbon" aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  )
}
