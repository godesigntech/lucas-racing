"use client"

import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, MessageSquare, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { OptionGroup } from "@/components/products/configurator/option-group"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHelmetConfigurator } from "@/hooks/use-helmet-configurator"
import { basket } from "@/lib/basket/basket-store"
import { getCategory } from "@/lib/catalog/categories"
import { configurationToText, getInitialConfiguration, getOptionGroups } from "@/lib/configurator/helmet-configuration"
import { formatMoney } from "@/lib/format"
import { configFromSearchParams, configToSearchParams } from "@/lib/studio/share-config"
import type { PriceBook } from "@/types/catalog"
import type { ConfigKey, HelmetConfiguration } from "@/types/configurator"
import type { CatalogProduct } from "@/types/product"

import { ModelCards } from "./model-cards"
import { ReviewStep } from "./review-step"
import { SegmentedControl } from "./segmented-control"
import { StepTabs } from "./step-tabs"
import { StudioActions } from "./studio-actions"
import { StudioPreview } from "./studio-preview"
import { studioSteps, type StudioStepId } from "./studio-steps"

interface HelmetStudioProps {
  product: CatalogProduct
  priceBook: PriceBook
}

const noSubscription = () => () => {}

/**
 * Step-by-step helmet builder: live preview on the left, steps and running total on the right.
 * A shared link (?model=…&finish=…) is read in the browser after load; the studio then
 * remounts with that build, so the prerendered page always starts from the design's default.
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
  const { groups, config, setOption, disabled, look, summary, price } = useHelmetConfigurator(product, priceBook, startFrom)
  const [stepId, setStepId] = useState<StudioStepId>("helmet")
  const previewRef = useRef<HTMLDivElement>(null)

  const stepIndex = studioSteps.findIndex((step) => step.id === stepId)
  const step = studioSteps[stepIndex]
  const nextStep = studioSteps[stepIndex + 1]
  const previousStep = studioSteps[stepIndex - 1]
  const group = (key: ConfigKey) => groups.find((item) => item.key === key)!
  const model = priceBook.models.find((item) => item.id === config.model)
  const enquiryHref = `/contact?${new URLSearchParams({ design: product.slug, build: configurationToText(product, summary) })}`

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

  function renderOption(key: ConfigKey, description?: string) {
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
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <Link
            href={`/products/${product.slug}`}
            className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-carbon"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Lucas Racing / {product.name} design studio
          </Link>
          <h1 className="display text-5xl sm:text-6xl">
            Make it unmistakably yours<span className="text-lime-ink">.</span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Build your {product.name} helmet step by step. Every tool is open to explore, with no sign-up needed.
          </p>
        </div>
        <StudioActions
          shareUrl={`/products/${product.slug}/customize?${configToSearchParams(config)}`}
          enquiryHref={enquiryHref}
          imageName={`lucas-racing-${product.slug}.png`}
          imageCaption={`${product.name} · ${model?.name ?? ""}`}
          getPreviewSvg={() => previewRef.current?.querySelector("svg") ?? null}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <StudioPreview
            ref={previewRef}
            look={look}
            modelId={config.model}
            modelName={model?.name ?? product.name}
            designLabel={`${getCategory(product.category).label} · ${product.name}`}
          />
        </div>

        <section aria-label="Build steps" className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card">
          <StepTabs current={stepId} onSelect={setStepId} />

          <div
            role="tabpanel"
            id={`studio-panel-${step.id}`}
            aria-labelledby={`studio-tab-${step.id}`}
            className="flex-1 space-y-6 p-5 sm:p-7"
          >
            <div className="space-y-1.5">
              <h2 className="font-display text-3xl font-bold uppercase leading-tight">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>

            {step.id === "helmet" && (
              <>
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
              </>
            )}

            {step.id === "design" && (
              <>
                {renderOption("finish")}
                {renderOption("base")}
              </>
            )}

            {step.id === "materials" && (
              <>
                {renderOption("film")}
                {renderOption("trim")}
              </>
            )}

            {step.id === "details" && (
              <>
                {renderOption("spoiler")}
                <p className="rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
                  Want your name, race number or sponsor logos on it? Add them in the order notes at checkout and we&apos;ll
                  place them on your proof.
                </p>
              </>
            )}

            {step.id === "review" && <ReviewStep summary={summary} price={price} onEdit={setStepId} />}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-carbon/10 bg-paper/60 p-5 sm:px-7">
            <div className="min-w-0">
              <p className="eyebrow text-[0.65rem] text-muted-foreground">Your build</p>
              <p className="font-display text-3xl font-bold leading-tight sm:text-4xl" aria-live="polite">
                {price ? formatMoney(price.total) : "On request"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {previousStep && (
                <Button variant="ghost" size="icon" onClick={() => setStepId(previousStep.id)} aria-label={`Back to ${previousStep.label.toLowerCase()}`}>
                  <ArrowLeft />
                </Button>
              )}
              {nextStep ? (
                <Button size="lg" onClick={() => setStepId(nextStep.id)}>
                  Next: {nextStep.label.toLowerCase()} <ArrowRight />
                </Button>
              ) : price ? (
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
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
