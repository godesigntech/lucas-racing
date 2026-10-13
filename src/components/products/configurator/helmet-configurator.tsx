"use client"

import { Box } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { useHelmetConfigurator } from "@/hooks/use-helmet-configurator"
import { configurationToText } from "@/lib/configurator/helmet-configuration"
import type { Product } from "@/types/product"

import { ConfigurationSummary } from "./configuration-summary"
import { OptionGroup } from "./option-group"

export function HelmetConfigurator({ product }: { product: Product }) {
  const { groups, config, setOption, reset, isDirty, disabled, look, summary } = useHelmetConfigurator(product)

  const enquiryParams = new URLSearchParams({
    design: product.slug,
    build: configurationToText(product, summary),
  })
  const sizeHelp =
    config.route === "own" ? "The size of the helmet you're sending in." : "We'll order a new helmet in this size."

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="relative overflow-hidden rounded-3xl border border-carbon/10 bg-[radial-gradient(circle_at_50%_40%,#ffffff,#e8e7e0_75%)] p-6 sm:p-10">
          <HelmetArt look={look} title={`Live preview of your ${product.name} helmet`} />
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Box className="size-3.5" aria-hidden />
            Illustrated preview. The interactive 3D builder is on its way.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-7 rounded-3xl border border-carbon/10 bg-card p-6">
          {groups.map((group) => (
            <OptionGroup
              key={group.key}
              group={group}
              value={config[group.key]}
              onChange={(value) => setOption(group.key, value)}
              disabledReason={disabled[group.key]}
              description={group.key === "size" ? sizeHelp : undefined}
            />
          ))}
        </div>

        <ConfigurationSummary
          summary={summary}
          startingPrice={product.startingPrice}
          enquiryHref={`/contact?${enquiryParams.toString()}`}
          canReset={isDirty}
          onReset={reset}
        />
      </div>
    </div>
  )
}
