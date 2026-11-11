"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "react-toastify"

import { MoneyInput } from "@/components/admin/money-input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendBuildQuotePrice } from "@/lib/actions/admin/quotes"
import { helmetDeposit } from "@/lib/configurator/pricing-rules"
import { formatMoney } from "@/lib/format"

interface QuotePriceFormProps {
  id: string
  chrome: boolean
  /** The chrome base coat's price, paid in full with the deposit. */
  chromePrice: number
  /** What the builder could price on its own, as a starting point. */
  pricedSoFar: number | null
  quotedPrice: number | null
}

/** Price a bespoke build and email the customer the price and deposit. */
export function QuotePriceForm({ id, chrome, chromePrice, pricedSoFar, quotedPrice }: QuotePriceFormProps) {
  const [price, setPrice] = useState<number>(quotedPrice ?? Number.NaN)
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()
  const valid = Number.isFinite(price) && price > 0
  const deposit = valid ? helmetDeposit(price, { baseCoat: chrome ? "chrome" : undefined }, chromePrice) : null

  function send() {
    startTransition(async () => {
      const result = await sendBuildQuotePrice(id, { price, note })
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) send()
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="quote-price" className="text-sm font-medium">
          Price for this helmet
        </label>
        <MoneyInput id="quote-price" value={price} onChange={setPrice} placeholder="0.00" />
        {pricedSoFar !== null && (
          <p className="text-xs text-muted-foreground">The builder priced the standard parts at {formatMoney(pricedSoFar)}, before the bespoke work.</p>
        )}
      </div>
      <p className="rounded-xl bg-paper/70 p-3 text-sm">
        Deposit: <span className="font-semibold tabular-nums">{deposit === null ? "—" : formatMoney(deposit)}</span>
        <span className="block text-xs text-muted-foreground">10% of the price{chrome ? `, plus the chrome base coat in full (£${chromePrice})` : ""}.</span>
      </p>
      <div className="space-y-1.5">
        <label htmlFor="quote-note" className="text-sm font-medium">
          Note to the customer <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea id="quote-note" rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Included in the email." />
      </div>
      <Button type="submit" className="w-full" disabled={!valid || isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {quotedPrice === null ? "Send price to customer" : "Send updated price"}
      </Button>
    </form>
  )
}
