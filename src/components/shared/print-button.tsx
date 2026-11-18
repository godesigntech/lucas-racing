"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Opens the browser's print dialog, which can also save the page as a PDF. */
export function PrintButton({ label = "Print this page" }: { label?: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer /> {label}
    </Button>
  )
}
