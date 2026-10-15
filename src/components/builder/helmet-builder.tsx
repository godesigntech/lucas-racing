"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
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
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/browser"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

import { builderSteps, type BuilderStepId } from "./builder-steps"
import { BuilderStepper } from "./builder-stepper"
import { StepDetails } from "./step-details"
import { StepFinish, StepHelmet, StepSize, StepTrims } from "./step-options"
import { StepParts } from "./step-parts"
import { StepReview } from "./step-review"
import { StepTemplate } from "./step-template"

interface HelmetBuilderProps {
  products: CatalogProduct[]
  priceBook: PriceBook
}

const noSubscription = () => () => {}

/**
 * The helmet builder. Opens on ?template=<slug> (or the first template), a share
 * link's build, or a saved design (?design=<id>). The page passes the query it
 * rendered with, and the browser's URL takes over once loaded.
 */
export function HelmetBuilder({ products, priceBook, initialSearch = "" }: HelmetBuilderProps & { initialSearch?: string }) {
  const search = useSyncExternalStore(noSubscription, () => window.location.search, () => initialSearch)
  const params = useMemo(() => new URLSearchParams(search), [search])
  const saved = useSavedDesign(params.get("design"))

  const start = useMemo(() => {
    const slug = saved?.productSlug ?? params.get("template")
    const product = products.find((item) => item.slug === slug) ?? products[0]
    const shared = [...params.keys()].some((key) => key !== "template" && key !== "design")
    return { product, config: saved?.config ?? (shared ? (Object.fromEntries(params) as unknown as HelmetConfiguration) : undefined) }
  }, [saved, params, products])

  if (!start.product) {
    return <p className="rounded-3xl border border-carbon/10 bg-card p-8 text-center text-muted-foreground">No templates are available right now.</p>
  }
  return <BuilderBody key={`${search}|${saved ? "saved" : ""}`} products={products} priceBook={priceBook} start={{ product: start.product, config: start.config }} />
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
  start,
}: HelmetBuilderProps & { start: { product: CatalogProduct; config?: HelmetConfiguration } }) {
  const { product, config, update, chooseTemplate, look, price, summary } = useHelmetConfigurator(products, priceBook, start)
  const [stepId, setStepId] = useState<BuilderStepId>("helmet")
  const [visited, setVisited] = useState<Set<BuilderStepId>>(() => new Set(["helmet"]))
  // Which exact build was last added, so editing it brings "Add to basket" back.
  const [addedBuild, setAddedBuild] = useState<string | null>(null)
  const added = addedBuild === JSON.stringify(config)
  const previewRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  const index = builderSteps.findIndex((step) => step.id === stepId)
  const step = builderSteps[index]
  const next = builderSteps[index + 1]
  const previous = builderSteps[index - 1]
  const model = priceBook.models.find((item) => item.id === config.model)
  const models = priceBook.models.filter((item) => item.isActive && product.models.includes(item.id))
  const enquiryHref = `/contact?${new URLSearchParams({ design: product.slug, build: configurationToText(product, summary) })}`

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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-24">
        <StudioPreview
          ref={previewRef}
          look={look}
          modelId={config.model}
          modelName={model?.name ?? "Helmet"}
          designLabel={`${getCategory(product.category).label} · ${product.name}`}
        />
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
              {price ? formatMoney(price.total) : "On request"}
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

          {stepId === "helmet" && <StepHelmet models={models} config={config} update={update} />}
          {stepId === "size" && <StepSize model={model} config={config} update={update} />}
          {stepId === "template" && <StepTemplate products={products} value={product.slug} modelId={config.model} onChange={chooseTemplate} />}
          {stepId === "parts" && <StepParts product={product} priceBook={priceBook} config={config} look={look} update={update} />}
          {stepId === "finish" && <StepFinish priceBook={priceBook} config={config} update={update} />}
          {stepId === "details" && <StepDetails config={config} update={update} returnTo={`/helmet-builder?template=${product.slug}`} />}
          {stepId === "trims" && <StepTrims priceBook={priceBook} config={config} update={update} />}
          {stepId === "review" && (
            <>
              <StepReview summary={summary} price={price} onEdit={go} />
              <div className="flex flex-wrap gap-2">
                <SaveDesignButton productSlug={product.slug} productName={product.name} config={config} />
                <StudioActions
                  shareUrl={`/helmet-builder?${configToSearchParams(config)}`}
                  enquiryHref={enquiryHref}
                  imageName={`lucas-racing-${product.slug}.png`}
                  imageCaption={`${product.name} · ${model?.name ?? ""}`}
                  getPreviewSvg={() => previewRef.current?.querySelector("svg") ?? null}
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
          ) : !price ? (
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
