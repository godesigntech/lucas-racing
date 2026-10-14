"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateOrderStatus } from "@/lib/actions/admin/orders"
import { orderStatusMeta, paymentStatusMeta } from "@/lib/orders/status"
import { orderStatusUpdateSchema, type OrderStatusUpdateValues } from "@/lib/validations/admin"
import { orderStatuses, paymentStatuses, type OrderStatus, type PaymentStatus } from "@/types/order"

interface OrderStatusFormProps {
  orderId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
}

/** Update an order's fulfilment and payment status, with an optional note for the history. */
export function OrderStatusForm({ orderId, status, paymentStatus }: OrderStatusFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrderStatusUpdateValues>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues: { status, paymentStatus, note: "" },
  })

  async function onSubmit(values: OrderStatusUpdateValues) {
    const result = await runAction(() => updateOrderStatus(orderId, values), setError)
    if (result?.ok) reset({ ...values, note: "" })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <FormField id="order-status" label="Order status">
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="order-status" className="w-full">
                <SelectValue>{orderStatusMeta[field.value].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {orderStatusMeta[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />
      <Controller
        control={control}
        name="paymentStatus"
        render={({ field }) => (
          <FormField id="payment-status" label="Payment">
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="payment-status" className="w-full">
                <SelectValue>{paymentStatusMeta[field.value].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {paymentStatusMeta[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />
      <FormField id="status-note" label="Note" optional hint="Shown to the customer in their order history." error={errors.note?.message}>
        <Textarea
          {...register("note")}
          {...fieldA11y("status-note", errors.note?.message, true)}
          rows={3}
          className="min-h-20"
          placeholder="e.g. Proof approved by email, payment link sent."
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Saving…" : "Update order"}
      </Button>
    </form>
  )
}
