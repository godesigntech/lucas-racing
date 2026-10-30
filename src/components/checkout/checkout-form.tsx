"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, CreditCard, Loader2, ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { AddressFields } from "@/components/forms/address-fields"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { placeOrder } from "@/lib/actions/checkout"
import { basket } from "@/lib/basket/basket-store"
import { basketSubtotal, toOrderItems, type AvailableLine } from "@/lib/basket/resolve-basket"
import { useResolvedBasket } from "@/lib/basket/use-resolved-basket"
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/checkout"
import type { Profile } from "@/types/account"
import type { PriceBook } from "@/types/catalog"
import type { CatalogProduct } from "@/types/product"
import type { DeliveryMethod } from "@/types/settings"
import type { ProductionOptions } from "@/lib/data/production"

import { CheckoutSection } from "./checkout-section"
import { ProductionDates } from "./production-dates"
import { DeliveryOptions } from "./delivery-options"
import { OrderSummaryCard } from "./order-summary-card"

interface CheckoutFormProps {
  profile: Profile
  deliveryMethods: DeliveryMethod[]
  products: CatalogProduct[]
  priceBook: PriceBook
  production: ProductionOptions
}

export function CheckoutForm({ profile, deliveryMethods, products, priceBook, production }: CheckoutFormProps) {
  const router = useRouter()
  const basketState = useResolvedBasket(products, priceBook)
  const loaded = basketState.loaded
  const [placedOrder, setPlacedOrder] = useState(false)
  const lines = basketState.lines.filter((line): line is AvailableLine => line.available)
  const subtotal = basketSubtotal(lines)
  const hasHelmets = lines.some((line) => line.kind === "helmet")

  const firstMethod = deliveryMethods[0]
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      deliveryMethod: firstMethod?.id ?? "",
      requiresAddress: firstMethod?.requiresAddress ?? true,
      address: {
        line1: profile.addressLine1,
        line2: profile.addressLine2,
        city: profile.city,
        county: profile.county,
        postcode: profile.postcode,
        country: profile.country || "United Kingdom",
      },
      notes: "",
      saveDetails: true,
      productionStartDate: "",
      rushTier: "standard",
      needsProduction: false,
      hasHelmet: false,
    },
  })

  const deliveryId = useWatch({ control, name: "deliveryMethod" })
  const delivery = deliveryMethods.find((method) => method.id === deliveryId)
  const startDate = useWatch({ control, name: "productionStartDate" }) ?? ""
  const rushTier = useWatch({ control, name: "rushTier" }) ?? "standard"
  // Only helmets go through the workshop; a parts-only order ships from stock.
  const chosenTier = production.tiers.find((tier) => tier.key === rushTier)
  const rushFee = hasHelmets ? (chosenTier?.fee ?? 0) : 0

  // The basket loads in the browser, so whether a start week is required is only known
  // once it has. Telling the schema here keeps the rule in one place.
  const needsProduction = hasHelmets && production.ready && production.weeks.some((week) => week.isBookable)
  useEffect(() => {
    setValue("needsProduction", needsProduction)
  }, [needsProduction, setValue])
  // Helmet orders need a full profile (phone and address), whatever the delivery method.
  useEffect(() => {
    setValue("hasHelmet", hasHelmets)
  }, [hasHelmets, setValue])
  const showAddress = Boolean(delivery?.requiresAddress) || hasHelmets

  async function onSubmit(values: CheckoutValues) {
    const result = await placeOrder({
      items: toOrderItems(lines),
      checkout: values,
    })

    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field.replace(/^checkout\./, "") as keyof CheckoutValues, { message })
      }
      toast.error(result.message)
      return
    }

    setPlacedOrder(true)
    basket.clear()
    toast.success(`Order ${result.data?.orderNumber} placed. Thank you!`)
    router.push(`/account/orders/${result.data?.orderNumber}?placed=1`)
  }

  if (!loaded) return <Skeleton className="h-96 rounded-3xl" aria-label="Loading your basket" />

  if (placedOrder) {
    return (
      <div role="status" className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-3xl border border-carbon/10 bg-card p-8 text-center">
        <Loader2 className="size-8 animate-spin text-brand-ink" aria-hidden />
        <p className="font-display text-2xl font-bold uppercase">Order placed</p>
        <p className="text-sm text-muted-foreground">Taking you to your order…</p>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nothing to check out"
        description="Your basket is empty. Add MS Kart parts, teamwear or a custom helmet first."
        action={
          <Button asChild>
            <Link href="/shop">
              Shop MS Kart <ArrowRight />
            </Link>
          </Button>
        }
      />
    )
  }

  const addressErrors = {
    line1: errors.address?.line1?.message,
    city: errors.address?.city?.message,
    postcode: errors.address?.postcode?.message,
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10"
    >
      <div className="min-w-0 space-y-5">
        <CheckoutSection step={1} title="Your details" description="We'll use these to confirm your order and send updates.">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="checkout-name" label="Full name" error={errors.name?.message} className="sm:col-span-2">
              <Input {...register("name")} {...fieldA11y("checkout-name", errors.name?.message)} autoComplete="name" />
            </FormField>
            <FormField id="checkout-email" label="Email" error={errors.email?.message}>
              <Input
                {...register("email")}
                {...fieldA11y("checkout-email", errors.email?.message)}
                type="email"
                autoComplete="email"
              />
            </FormField>
            <FormField id="checkout-phone" label="Phone" optional={!hasHelmets} error={errors.phone?.message}>
              <Input
                {...register("phone")}
                {...fieldA11y("checkout-phone", errors.phone?.message)}
                type="tel"
                autoComplete="tel"
              />
            </FormField>
          </div>
        </CheckoutSection>

        <CheckoutSection step={2} title="Delivery" description="How you'd like to receive your order.">
          <Controller
            control={control}
            name="deliveryMethod"
            render={({ field }) => (
              <DeliveryOptions
                methods={deliveryMethods}
                value={field.value}
                error={errors.deliveryMethod?.message}
                onChange={(id) => {
                  field.onChange(id)
                  setValue("requiresAddress", deliveryMethods.find((method) => method.id === id)?.requiresAddress ?? true)
                }}
              />
            )}
          />
          {showAddress && (
            <div className="mt-6 border-t border-carbon/10 pt-6">
              <h3 className="mb-1 text-sm font-semibold">{delivery?.requiresAddress ? "Delivery address" : "Your address"}</h3>
              {hasHelmets && (
                <p className="mb-4 text-xs text-muted-foreground">
                  Custom helmets need your full contact details. We save them to your account so the workshop can reach you.
                </p>
              )}
              {!hasHelmets && <div className="mb-3" />}
              <AddressFields
                register={register}
                idPrefix="checkout-address"
                errors={addressErrors}
                names={{
                  line1: "address.line1",
                  line2: "address.line2",
                  city: "address.city",
                  county: "address.county",
                  postcode: "address.postcode",
                  country: "address.country",
                }}
              />
            </div>
          )}
        </CheckoutSection>

        {hasHelmets && production.ready && (
          <CheckoutSection
            step={3}
            title="Production"
            description="When your helmet goes into the workshop. We confirm the exact date with your proof."
          >
            <ProductionDates
              weeks={production.weeks}
              tiers={production.tiers}
              standardLeadWeeks={production.standardLeadWeeks}
              startDate={startDate}
              rushTier={rushTier}
              error={errors.productionStartDate?.message}
              onChange={(next) => {
                setValue("productionStartDate", next.startDate, { shouldValidate: true })
                setValue("rushTier", next.rushTier)
              }}
            />
          </CheckoutSection>
        )}

        <CheckoutSection step={hasHelmets && production.ready ? 4 : 3} title="Anything else?" description="Optional notes for the team.">
          <FormField id="checkout-notes" label="Order notes" optional error={errors.notes?.message}>
            <Textarea
              {...register("notes")}
              {...fieldA11y("checkout-notes", errors.notes?.message)}
              rows={4}
              placeholder="e.g. the race date you need it for, or anything we should know about your order."
            />
          </FormField>
          {/* Helmet orders always save the details to the account; the choice only applies to other orders. */}
          {!hasHelmets && <Controller
            control={control}
            name="saveDetails"
            render={({ field }) => (
              <div className="mt-5 flex items-center gap-3">
                <Checkbox
                  id="checkout-save"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <Label htmlFor="checkout-save" className="text-sm font-normal">
                  Save these details to my account for next time
                </Label>
              </div>
            )}
          />}
        </CheckoutSection>

        <div className="flex gap-4 rounded-3xl border border-brand-ink/20 bg-accent p-5 text-accent-foreground">
          <CreditCard className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">No payment needed today</p>
            <p>
              {hasHelmets
                ? "We'll email your digital proof. Once you approve it, we send a secure payment link before any work starts."
                : "We'll confirm your order and stock, then send you a secure payment link."}
            </p>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <OrderSummaryCard
          lines={lines}
          subtotal={subtotal}
          deliveryLabel={delivery?.label}
          deliveryPrice={delivery?.price ?? 0}
          rushFee={rushFee}
          rushLabel={chosenTier && chosenTier.key !== "standard" ? chosenTier.label : undefined}
        >
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {isSubmitting ? "Placing order…" : "Place order"}
          </Button>
          <p className="text-center text-xs text-paper/55">
            By placing your order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms
            </Link>
            .
          </p>
        </OrderSummaryCard>
      </div>
    </form>
  )
}
