import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { journeySteps } from "@/components/admin/builder/builder-steps-meta"

export const metadata = { title: "Helmet builder" }

export default function AdminBuilderPage() {
  return (
    <>
      <AdminPageHeader
        title="Helmet builder"
        description="The customer's 16 steps, in order. Open a step to change what customers can choose there and what it costs. A helmet's price is the template's starting price plus the extras chosen in each step."
      />
      <ol className="grid gap-3 md:grid-cols-2">
        {journeySteps.map((step) => {
          const body = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-carbon font-display text-lg font-bold text-brand">
                {step.step}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{step.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {step.note ?? "Set up the choices and prices for this step."}
                </span>
              </span>
              {step.adminHref && <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
            </>
          )
          return (
            <li key={step.step}>
              {step.adminHref ? (
                <Link
                  href={step.adminHref}
                  className="flex h-full items-center gap-4 rounded-2xl border border-carbon/10 bg-card p-4 transition-colors hover:border-carbon/40"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full items-center gap-4 rounded-2xl border border-dashed border-carbon/15 bg-card p-4">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}
