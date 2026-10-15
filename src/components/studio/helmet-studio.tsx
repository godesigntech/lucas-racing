"use client"

import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, MessageSquare, RotateCcw, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { OptionGroup } from "@/components/products/configurator/option-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHelmetConfigurator } from "@/hooks/use-helmet-configurator"
import { basket } from "@/lib/basket/basket-store"
import { getCategory } from "@/lib/catalog/categories"
import { configurationToText, getInitialConfiguration, getOptionGroups } from "@/lib/configurator/helmet-configuration"
import { formatMoney, formatPrice } from "@/lib/format"
import { configFromSearchParams, configToSearchParams } from "@/lib/studio/share-config"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { ConfigKey, HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

import { FilmPicker } from "./film-picker"
import { ModelCards } from "./model-cards"
import { SegmentedControl } from "./segmented-control"
import { StudioActions } from "./studio-actions"
import { StudioPreview } from "./studio-preview"
import { StudioSection } from "./studio-section"

interface HelmetStudioProps {
  product: CatalogProduct
  priceBook: PriceBook
}

type SectionId = "helmet" | "colour" | "film" | "extras"

const sections: { id: SectionId; title: string }[] = [
  { id: "helmet", title: "Helmet" },
  { id: "colour", title: "Finish & colour" },
  { id: "film", title: "Hydro-dip film" },
  { id: "extras", title: "Trim & extras" },
]

const noSubscription = () => () => {}

/**
 * The helmet builder, shown at the top of each product page: live preview on the
 * left, numbered option sections and the running total on the right.
 * A shared link (?model=…&film=…) is read in the browser after load; the studio
 * then remounts with that build, so the prerendered page starts from the design's default.
 */
export function HelmetStudio(props: HelmetStudioProps) {
  const search = useSyncExternalStore(
    noSubscription,
    () => window.location.search,
    () => "",
  )
  const startFrom = useMemo(() => {
    if (!search) return undefined
    const defaults = getInitialConfiguration(props.product, props.priceBook)
    return configFromSearchParams(new URLSearchParams(search), defaults, getOptionGroups(props.product, props.priceBook, defaults))
  }, [search, props.product, props.priceBook])

  return <StudioBody key={search} {...props} startFrom={startFrom} />
}

function StudioBody({ product, priceBook, startFrom }: HelmetStudioProps & { startFrom?: HelmetConfiguration }) {
  const { groups, config, setOption, disabled, look, summary, price, reset, isDirty } = useHelmetConfigurator(
    product,
    priceBook,
    startFrom,
  )
  const [open, setOpen] = useState<SectionId | null>("helmet")
  const [showBreakdown, setShowBreakdown] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const totalRef = useRef<HTMLDivElement>(null)

  const group = (key: ConfigKey) => groups.find((item) => item.key === key)!
  const label = (key: ConfigKey) => summary.find((line) => line.key === key)?.value ?? ""
  const model = priceBook.models.find((item) => item.id === config.model)
  const film = priceBook.films.find((item) => item.id === config.film)
  const category = getCategory(product.category)
  const enquiryHref = `/contact?${new URLSearchParams({ design: product.slug, build: configurationToText(product, summary) })}`

  const summaries: Record<SectionId, string> = {
    helmet: [model?.shortName, config.route === "own" ? "Your helmet" : "New helmet", `Size ${config.size}`].filter(Boolean).join(" · "),
    colour: disabled.base ? label("finish") : `${label("finish")} · ${label("base")}`,
    film: film?.textureUrl ? `${film.category} · ${film.code}` : "Solid colour, no film",
    extras: `${label("trim")} rubbers · ${config.spoiler === "yes" ? "Rear spoiler" : "No spoiler"}`,
  }

  function toggle(id: SectionId) {
    setOpen((current) => (current === id ? null : id))
  }

  function goToNext(id: SectionId) {
    const next = sections[sections.findIndex((section) => section.id === id) + 1]
    if (next) setOpen(next.id)
    else {
      setOpen(null)
      totalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  function addToBasket() {
    basket.add({ slug: product.slug, name: product.name, config })
    toast.success(
      <span>
        {product.name} added to your basket.{" "}
        <Link href="/basket" className="font-semibold underline underline-offset-2">
          View basket
        </Link>
      </span>,
    )
  }

  function nextButton(id: SectionId) {
    const index = sections.findIndex((section) => section.id === id)
    const next = sections[index + 1]
    return (
      <Button variant="secondary" size="sm" onClick={() => goToNext(id)}>
        {next ? `Next: ${next.title}` : "Done, see my total"} <ArrowRight />
      </Button>
    )
  }

  function option(key: ConfigKey, description?: string) {
    return (
      <OptionGroup
        key={key}
        group={group(key)}
        value={config[key]}
        onChange={(value) => setOption(key, value)}
        disabledReason={disabled[key]}
        description={description}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-24">
        <StudioPreview
          ref={previewRef}
          look={look}
          modelId={config.model}
          modelName={model?.name ?? product.name}
          designLabel={`${category.label} · ${product.name}`}
        />
      </div>

      <div className="min-w-0 space-y-5">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-7 rounded-full border-carbon/20 px-3 text-xs">
              {category.label}
            </Badge>
            {product.badge && <Badge className="h-7 rounded-full bg-carbon px-3 text-xs text-paper">{product.badge}</Badge>}
          </div>
          <h1 className="display text-5xl sm:text-6xl">{product.name}</h1>
          <p className="text-muted-foreground">{product.tagline}</p>
          <p className="text-sm">
            <span className="font-semibold">{formatPrice(product.startingPrice)}</span>
            <span className="text-muted-foreground"> · design it below, the preview and price update as you go</span>
          </p>
        </header>

        <div className="overflow-hidden rounded-[1.5rem] border border-carbon/10 bg-card">
          <StudioSection number={1} title="Helmet" summary={summaries.helmet} open={open === "helmet"} onToggle={() => toggle("helmet")}>
            <SegmentedControl group={group("route")} value={config.route} onChange={(value) => setOption("route", value)} />
            <ModelCards
              models={priceBook.models.filter((item) => product.models.includes(item.id))}
              value={config.model}
              supplyNew={config.route === "new"}
              onChange={(value) => setOption("model", value)}
            />
            <div className="space-y-2">
              <label htmlFor="studio-size" className="text-sm font-semibold">
                Helmet size
              </label>
              <Select value={config.size} onValueChange={(value) => setOption("size", value)}>
                <SelectTrigger id="studio-size" className="w-full sm:w-56">
                  <SelectValue>{config.size}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {group("size").choices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.route === "own" ? "The size of the helmet you're sending in." : "We'll order a new helmet in this size."}
              </p>
            </div>
            {nextButton("helmet")}
          </StudioSection>

          <StudioSection number={2} title="Finish & colour" summary={summaries.colour} open={open === "colour"} onToggle={() => toggle("colour")}>
            {option("finish")}
            {option("base", "Shows through wherever a film is transparent, and on the plain areas of the design.")}
            {nextButton("colour")}
          </StudioSection>

          <StudioSection number={3} title="Hydro-dip film" summary={summaries.film} open={open === "film"} onToggle={() => toggle("film")}>
            <p className="text-sm text-muted-foreground">
              Pick from our in-stock films. Turn the 3D helmet to see the pattern up close, or switch to Side to see where it
              sits on this design.
            </p>
            <FilmPicker films={priceBook.films} value={config.film} onChange={(value) => setOption("film", value)} />
            {nextButton("film")}
          </StudioSection>

          <StudioSection number={4} title="Trim & extras" summary={summaries.extras} open={open === "extras"} onToggle={() => toggle("extras")}>
            {option("trim")}
            {option("spoiler")}
            <p className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
              Want your name, race number or sponsor logos on it? Add them in the order notes at checkout and we&apos;ll put
              them on your proof.
            </p>
            {nextButton("extras")}
          </StudioSection>
        </div>

        <div ref={totalRef} className="rounded-[1.5rem] border border-carbon/10 bg-card p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-[0.65rem] text-muted-foreground">Your build</p>
              <p className="font-display text-4xl font-bold leading-none" aria-live="polite">
                {price ? formatMoney(price.total) : "Price on request"}
              </p>
            </div>
            {price && (
              <button
                type="button"
                aria-expanded={showBreakdown}
                onClick={() => setShowBreakdown((value) => !value)}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-carbon"
              >
                What&apos;s included
                <ChevronDown className={cn("size-4 transition-transform", showBreakdown && "rotate-180")} aria-hidden />
              </button>
            )}
          </div>

          {price && showBreakdown && (
            <dl className="mt-4 space-y-1.5 border-t border-carbon/10 pt-4 text-sm" aria-label="Price breakdown">
              {price.lines.map((line) => (
                <div key={line.label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="tabular-nums">{formatMoney(line.amount)}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            {price ? (
              <Button size="lg" onClick={addToBasket}>
                <ShoppingBag /> Add to basket
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href={enquiryHref}>
                  <MessageSquare /> Send enquiry
                </Link>
              </Button>
            )}
            {isDirty && (
              <Button variant="ghost" size="lg" onClick={reset}>
                <RotateCcw /> Start over
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            You approve a proof of the exact design before anything is masked or dipped.
          </p>

          <div className="mt-4 border-t border-carbon/10 pt-4">
            <StudioActions
              shareUrl={`/products/${product.slug}?${configToSearchParams(config)}`}
              enquiryHref={enquiryHref}
              imageName={`lucas-racing-${product.slug}.png`}
              imageCaption={`${product.name} · ${model?.name ?? ""}`}
              getPreviewSvg={() => previewRef.current?.querySelector("svg") ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
