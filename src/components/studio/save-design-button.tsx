"use client"

import { useEffect, useId, useState, useTransition } from "react"
import Link from "next/link"
import { Bookmark, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { saveDesign } from "@/lib/actions/designs"
import { createClient } from "@/lib/supabase/browser"
import type { HelmetConfiguration } from "@/types/configurator"

interface SaveDesignButtonProps {
  productSlug: string
  productName: string
  config: HelmetConfiguration
}

/** Saves the current build to the customer's account; guests are sent to log in first. */
export function SaveDesignButton({ productSlug, productName, config }: SaveDesignButtonProps) {
  const inputId = useId()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`My ${productName}`)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getSession()
      .then(({ data }) => !cancelled && setSignedIn(Boolean(data.session)))
    return () => {
      cancelled = true
    }
  }, [])

  if (signedIn === false) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/login?next=${encodeURIComponent(`/products/${productSlug}`)}`}>
          <Bookmark /> Log in to save
        </Link>
      </Button>
    )
  }

  function save() {
    startTransition(async () => {
      const result = await saveDesign({ productSlug, name, config })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setOpen(false)
      toast.success(
        <span>
          {result.message}{" "}
          <Link href="/account/designs" className="font-semibold underline underline-offset-2">
            View saved designs
          </Link>
        </span>,
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={signedIn === null}>
          <Bookmark /> Save design
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save this design</DialogTitle>
          <DialogDescription>It&apos;s kept in your account, so you can come back to it or order it later.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) save()
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="text-sm font-medium">
              Name
            </label>
            <Input id={inputId} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              Save design
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
