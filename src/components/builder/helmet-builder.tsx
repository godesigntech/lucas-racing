"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, MessageSquare, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { SaveDesignButton } from "@/components/studio/save-design-button"
import { StudioActions } from "@/components/studio/studio-actions"
import { StudioPreview } from "@/components/studio/studio-preview"
import { Button } from "@/components/ui/button"
import { useHelmetConfigurator } from "@/hooks/use-helmet-configurator"
import { basket } from "@/lib/basket/basket-store"
import { getCategory } from "@/lib/catalog/categories"
import { configToSearchParams, configurationToText } from "@/lib/configurator/helmet-configuration"
import { pendingPrices } from "@/lib/configurator/pending-prices"
import { requiresGloss, resolveRegions } from "@/lib/configurator/regions"
import { buildSceneDesign } from "@/lib/configurator/scene-design"
import { formatMoney } from "@/lib/format"
import { hasCustomBellParts } from "@/lib/helmet-3d/parts"
import { createClient } from "@/lib/supabase/browser"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"
import type { AeroKit, DesignTemplate, Visor } from "@/types/templates"

import { buildSteps, builderSteps, type BuilderStepId } from "./builder-steps"
import { BuilderStepper } from "./builder-stepper"
import { RegionStep } from "./region-step"
import { StepFinish, StepHelmet, StepRoute, StepSize, StepTrims } from "./step-options"
import { StepAero, StepVisor, StepVisorStrip } from "./step-fittings"
import { StepLogos, StepPersonalisation } from "./step-personal"
import { StepReview } from "./step-review"
import { StepTemplate } from "./step-template"

interface HelmetBuilderProps {
  products: CatalogProduct[]
  priceBook: PriceBook
  templates?: DesignTemplate[]
  aeroKits?: AeroKit[]
  visors?: Visor[]
}

const noSubscription = () => () => {}

/** Where an in-progress build is kept, so a reload doesn't lose it. */
const DRAFT_KEY = "lucas-racing:builder-draft:v1"

/**
 * The helmet builder. Opens on ?template=<slug> (or the first template), a share
 * link's build, or a saved design (?design=<id>). The page passes the query it
 * rendered with, and the browser's URL takes over once loaded.
 */
export function HelmetBuilder({
  products,
  priceBook,
  templates = [],
  aeroKits = [],
  visors = [],
  initialSearch = "",
}: HelmetBuilderProps & { initialSearch?: string }) {
  const search = useSyncExternalStore(noSubscription, () => window.location.search, () => initialSearch)
  const params = useMemo(() => new URLSearchParams(search), [search])
  const saved = useSavedDesign(params.get("design"))

  // The draft in sessionStorage is deliberately not read here: it only exists in the
  // browser, so using it during render would make the first client render disagree with
  // the server's HTML. BuilderBody restores it after hydration instead.
  const start = useMemo(() => {
    const slug = saved?.productSlug ?? params.get("template")
    const product = products.find((item) => item.slug === slug) ?? products[0]
    const shared = [...params.keys()].some((key) => key !== "template" && key !== "design")
    return {
      product,
      config: saved?.config ?? (shared ? decodeShared(params) : undefined),
      shared: shared || Boolean(saved),
    }
  }, [saved, params, products])

  if (!start.product) {
    return <p className="rounded-3xl border border-carbon/10 bg-card p-8 text-center text-muted-foreground">No templates are available right now.</p>
  }
  return (
    <BuilderBody
      key={`${search}|${saved ? "saved" : ""}`}
      products={products}
      priceBook={priceBook}
      templates={templates}
      aeroKits={aeroKits}
      visors={visors}
      start={{ product: start.product, config: start.config, shared: start.shared }}
    />
  )
}

/**
 * A share link carries the flat fields as query parameters, as it always has, plus
 * everything that doesn't fit in one (regions, personalisation, logos) in `d`.
 */
function decodeShared(params: URLSearchParams): HelmetConfiguration {
  const flat = Object.fromEntries(params) as unknown as HelmetConfiguration
  const packed = params.get("d")
  if (!packed) return flat
  try {
    const json = atob(packed.replace(/-/g, "+").replace(/_/g, "/"))
    return { ...flat, ...(JSON.parse(json) as Partial<HelmetConfiguration>) }
  } catch {
    return flat
  }
}

function readDraft(): { productSlug: string; config: HelmetConfiguration } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as { productSlug: string; config: HelmetConfiguration }) : null
  } catch {
    return null
  }
}

/** A design saved in the customer's account, once loaded. Only its owner can read it. */
function useSavedDesign(designId: string | null): { productSlug: string; config: HelmetConfiguration } | null {
  const [loaded, setLoaded] = useState<{ id: string; productSlug: string; config: HelmetConfiguration } | null>(null)
  useEffect(() => {
    if (!designId) return
    let cancelled = false
    createClient()
      .from("saved_designs")
      .select("config, product_slug")
      .eq("id", designId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setLoaded({ id: designId, productSlug: data.product_slug, config: data.config as unknown as HelmetConfiguration })
      })
    return () => {
      cancelled = true
    }
  }, [designId])
  return loaded && loaded.id === designId ? loaded : null
}

function BuilderBody({
  products,
  priceBook,
  templates = [],
  aeroKits = [],
  visors = [],
  start,
}: HelmetBuilderProps & { start: { product: CatalogProduct; config?: HelmetConfiguration; shared?: boolean } }) {
  // Resolved from the build's own template slug, so switching template can't be stale.
  const getExtras = useCallback(
    (current: HelmetConfiguration) => {
      const design = products.find((item) => item.slug === current.template) ?? start.product
      return {
        regions: resolveRegions(design, current.model, templates).map(({ key, label }) => ({ key, label })),
        aeroKits,
        visors,
      }
    },
    [products, start.product, templates, aeroKits, visors],
  )
  const { product, config, update, chooseTemplate, look, price, summary } = useHelmetConfigurator(products, priceBook, start, getExtras)
  const [stepId, setStepId] = useState<BuilderStepId>("helmet")
  const [visited, setVisited] = useState<Set<BuilderStepId>>(() => new Set(["helmet"]))
  // Signed URLs for the customer's logos, so the 3D preview can draw them.
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>({})
  // Which exact build was last added, so editing it brings "Add to basket" back.
  const [addedBuild, setAddedBuild] = useState<string | null>(null)
  const added = addedBuild === JSON.stringify(config)
  const previewRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  const index = builderSteps.findIndex((step) => step.id === stepId)
  const step = builderSteps[index]
  const buildIndex = buildSteps.findIndex((item) => item.id === stepId)
  const next = buildSteps[buildIndex + 1]
  const previous = buildSteps[buildIndex - 1]
  const model = priceBook.models.find((item) => item.id === config.model)
  const models = priceBook.models.filter((item) => item.isActive && product.models.includes(item.id))
  const enquiryHref = `/contact?${new URLSearchParams({ design: product.slug, build: configurationToText(product, summary) })}`

  const regions = useMemo(() => resolveRegions(product, config.model, templates), [product, config.model, templates])
  const glossOnly = requiresGloss(config, regions)
  const design = useMemo(() => buildSceneDesign(config, regions, priceBook, logoUrls), [config, regions, priceBook, logoUrls])
  const visor = useMemo(() => visors.find((item) => item.id === config.visor) ?? null, [visors, config.visor])
  const aeroMesh = useMemo(() => aeroKits.find((kit) => kit.id === config.aero)?.meshName ?? null, [aeroKits, config.aero])

  // Anything the workshop hasn't priced yet. The build is still previewable; checkout isn't.
  const pending = useMemo(
    () => pendingPrices(config, regions, priceBook, { aeroKits, visors }),
    [config, regions, priceBook, aeroKits, visors],
  )

  const onLogoUrl = useCallback((path: string, url: string) => {
    setLogoUrls((current) => (current[path] === url ? current : { ...current, [path]: url }))
  }, [])

  // Picks up an unfinished build after a reload. Done here rather than in the initial
  // state because sessionStorage doesn't exist on the server, and a share link or a
  // saved design always wins over it.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (start.shared) return
    const draft = readDraft()
    if (draft && draft.productSlug === product.slug) update(draft.config)
  }, [start.shared, product.slug, update])

  // Metallic and chrome are lacquered gloss, which place_order() also enforces.
  useEffect(() => {
    if (glossOnly && config.finish !== "gloss") update({ finish: "gloss" })
  }, [glossOnly, config.finish, update])

  // Keep the build through a reload, and keep the address bar shareable.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ productSlug: product.slug, config }))
    } catch {
      // Private browsing, or storage turned off: the build just won't survive a reload.
    }
    const url = `${window.location.pathname}?${configToSearchParams(config)}`
    window.history.replaceState(window.history.state, "", url)
  }, [config, product.slug])

  function go(id: BuilderStepId) {
    setStepId(id)
    setVisited((current) => new Set(current).add(id))
    // On phones the panel sits under the preview: bring the new step into view.
    if (window.matchMedia("(max-width: 1023px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function addToBasket() {
    basket.add({ slug: product.slug, name: product.name, config })
    setAddedBuild(JSON.stringify(config))
    toast.success(
      <span>
        {product.name} added to your basket.{" "}
        <Link href="/basket" className="font-semibold underline underline-offset-2">
          View basket
        </Link>
      </span>,
    )
  }

  const blocked = pending.length > 0

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-24">
        <StudioPreview
          ref={previewRef}
          look={look}
          modelId={config.model}
          templateSlug={product.slug}
          modelName={model?.name ?? "Helmet"}
          designLabel={`${getCategory(product.category).label} · ${product.name}`}
          design={design}
          visor={visor}
          aeroMesh={aeroMesh}
        />
        {config.model === "bell-kc7" && (
          <Button variant="outline" className="mt-3 w-full" onClick={() => go("exterior")}>
            Customize trims, GrillZ & visor screws
          </Button>
        )}
      </div>

      {/* data-helmet-builder hides the floating chat buttons on phones (globals.css): they would cover the step buttons. */}
      <section ref={panelRef} data-helmet-builder aria-label="Build your helmet" className="flex min-w-0 scroll-mt-20 flex-col rounded-[1.75rem] border border-carbon/10 bg-card">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            <p className="eyebrow text-muted-foreground">Helmet builder</p>
            <h1 className="mt-1 truncate font-display text-3xl font-bold uppercase leading-none sm:text-4xl">{product.name}</h1>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-2xl font-bold leading-none sm:text-3xl" aria-live="polite">
              {blocked ? "On request" : price ? formatMoney(price.total) : "On request"}
            </span>
            <span className="text-xs text-muted-foreground">No payment today</span>
          </p>
        </header>

        <BuilderStepper current={stepId} visited={visited} onSelect={go} />

        <div className="flex-1 space-y-5 px-5 py-5 sm:px-6" role="region" aria-labelledby="builder-step-title">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Step {index + 1} of {builderSteps.length}
            </p>
            <h2 id="builder-step-title" className="font-display text-2xl font-bold uppercase leading-tight">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {stepId === "helmet" && (
            <div className="space-y-6">
              <StepHelmet models={models} config={config} update={update} />
              <StepRoute priceBook={priceBook} config={config} update={update} />
              <StepSize model={model} config={config} update={update} />
            </div>
          )}
          {stepId === "aero" && <StepAero aeroKits={aeroKits} config={config} update={update} />}
          {stepId === "template" && <StepTemplate products={products} value={product.slug} modelId={config.model} onChange={chooseTemplate} />}
          {stepId === "colours" && <RegionStep mode="colour" regions={regions} priceBook={priceBook} config={config} update={update} />}
          {stepId === "materials" && <RegionStep mode="material" regions={regions} priceBook={priceBook} config={config} update={update} />}
          {stepId === "films" && <RegionStep mode="film" regions={regions} priceBook={priceBook} config={config} update={update} />}
          {stepId === "pinstripes" && <RegionStep mode="pinstripe" regions={regions} priceBook={priceBook} config={config} update={update} />}
          {stepId === "finish" && <StepFinish priceBook={priceBook} config={config} update={update} glossOnly={glossOnly} />}
          {stepId === "details" && <StepPersonalisation priceBook={priceBook} config={config} update={update} />}
          {stepId === "logos" && (
            <StepLogos config={config} update={update} returnTo={`/helmet-builder?template=${product.slug}`} onLogoUrl={onLogoUrl} />
          )}
          {stepId === "exterior" && <StepTrims priceBook={priceBook} config={config} update={update} />}
          {stepId === "visor" && <StepVisor visors={visors} config={config} update={update} />}
          {stepId === "visorStrip" && <StepVisorStrip priceBook={priceBook} config={config} update={update} />}
          {stepId === "review" && (
            <>
              <StepReview summary={summary} price={price} onEdit={go} pending={pending} />
              <div className="flex flex-wrap gap-2">
                <SaveDesignButton productSlug={product.slug} productName={product.name} config={config} />
                <StudioActions
                  shareUrl={`/helmet-builder?${configToSearchParams(config)}`}
                  enquiryHref={enquiryHref}
                  imageName={`lucas-racing-${product.slug}.png`}
                  imageCaption={`${product.name} · ${model?.name ?? ""}`}
                  getPreviewSvg={() => previewRef.current?.querySelector("svg") ?? null}
                  imageUnavailableReason={
                    hasCustomBellParts(config) || design.regions.some((region) => region.maskUrl)
                      ? "Use Share link to include your 3D artwork and accessory colours. Illustrated image export does not show these yet."
                      : undefined
                  }
                />
              </div>
            </>
          )}
        </div>

        <footer className="sticky bottom-0 z-10 flex items-center gap-2 rounded-b-[1.75rem] border-t border-carbon/10 bg-card px-4 py-3 shadow-[0_-8px_20px_-14px_rgb(0_0_0/0.25)] sm:px-6">
          {previous ? (
            <Button variant="outline" onClick={() => go(previous.id)} aria-label={`Back to ${previous.label.toLowerCase()}`}>
              <ArrowLeft /> <span className="max-sm:sr-only">Back</span>
            </Button>
          ) : (
            <span />
          )}
          <span className="ml-auto" />
          {next ? (
            <Button size="lg" onClick={() => go(next.id)}>
              Next: {next.label} <ArrowRight />
            </Button>
          ) : blocked || !price ? (
            <Button asChild size="lg">
              <Link href={enquiryHref}>
                <MessageSquare /> Send enquiry
              </Link>
            </Button>
          ) : added ? (
            <Button asChild size="lg">
              <Link href="/checkout">
                Go to checkout <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button size="lg" onClick={addToBasket}>
              <ShoppingBag /> Add to basket · {formatMoney(price.total)}
            </Button>
          )}
        </footer>
      </section>
    </div>
  )
}
