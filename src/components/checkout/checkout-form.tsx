"use client"

import { useState } from "react"
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
import { basket, useBasket, useBasketLoaded } from "@/lib/basket/basket-store"
import { basketSubtotal, resolveBasketLine, type ResolvedBasketLine } from "@/lib/basket/resolve-basket"
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/checkout"
import type { Profile } from "@/types/account"
import type { PriceBook } from "@/types/catalog"
import type { CatalogProduct } from "@/types/product"
import type { DeliveryMethod } from "@/types/settings"

import { CheckoutSection } from "./checkout-section"
import { DeliveryOptions } from "./delivery-options"
import { OrderSummaryCard } from "./order-summary-card"

interface CheckoutFormProps {
  profile: Profile
  deliveryMethods: DeliveryMethod[]
  products: CatalogProduct[]
  priceBook: PriceBook
}

type AvailableLine = Extract<ResolvedBasketLine, { available: true }>

export function CheckoutForm({ profile, deliveryMethods, products, priceBook }: CheckoutFormProps) {
  const router = useRouter()
  const items = useBasket()
  const loaded = useBasketLoaded()
  const [placedOrder, setPlacedOrder] = useState(false)
  const lines = items
    .map((item) => resolveBasketLine(item, products, priceBook))
    .filter((line): line is AvailableLine => line.available)
  const subtotal = basketSubtotal(lines)

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
    },
  })

  const deliveryId = useWatch({ control, name: "deliveryMethod" })
  const delivery = deliveryMethods.find((method) => method.id === deliveryId)

  async function onSubmit(values: CheckoutValues) {
    const result = await placeOrder({
      items: lines.map((line) => ({ slug: line.item.slug, quantity: line.item.quantity, config: line.item.config })),
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
        description="Your basket is empty. Configure a helmet and add it to your basket first."
        action={
          <Button asChild>
            <Link href="/customisation">
              Browse helmet designs <ArrowRight />
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
        <CheckoutSection step={1} title="Your details" description="We'll use these to send your proof and updates.">
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
            <FormField id="checkout-phone" label="Phone" optional error={errors.phone?.message}>
              <Input
                {...register("phone")}
                {...fieldA11y("checkout-phone", errors.phone?.message)}
                type="tel"
                autoComplete="tel"
              />
            </FormField>
          </div>
        </CheckoutSection>

        <CheckoutSection step={2} title="Delivery" description="How you'd like to get your finished helmet.">
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
          {delivery?.requiresAddress && (
            <div className="mt-6 border-t border-carbon/10 pt-6">
              <h3 className="mb-4 text-sm font-semibold">Delivery address</h3>
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

        <CheckoutSection step={3} title="Anything else?" description="Optional notes for the workshop.">
          <FormField id="checkout-notes" label="Order notes" optional error={errors.notes?.message}>
            <Textarea
              {...register("notes")}
              {...fieldA11y("checkout-notes", errors.notes?.message)}
              rows={4}
              placeholder="e.g. race date you need it for, or the name and number to put on the helmet."
            />
          </FormField>
          <Controller
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
          />
        </CheckoutSection>

        <div className="flex gap-4 rounded-3xl border border-brand-ink/20 bg-accent p-5 text-accent-foreground">
          <CreditCard className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">No payment needed today</p>
            <p>
              We&apos;ll email your digital proof. Once you approve it, we send a secure payment link before any work
              starts.
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
