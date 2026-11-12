"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

/** A page in admin that failed to load: shown inside the admin layout, sidebar and all. */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-carbon/10 bg-card p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold uppercase">This page didn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong loading it, often a dropped connection. Try again; if it keeps happening, note what you were doing.
        {error.digest ? ` (Reference ${error.digest})` : ""}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={() => retry()}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Back to the dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
