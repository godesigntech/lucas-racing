"use client"

import { useId } from "react"

import { Input } from "@/components/ui/input"
import { logoPlacements, namePlacements, numberPlacements } from "@/lib/configurator/helmet-configuration"
import type { HelmetConfiguration } from "@/types/configurator"

import { LogoUpload } from "./logo-upload"
import { PlacementPicker } from "./placement-picker"

interface StepDetailsProps {
  config: HelmetConfiguration
  update: (changes: Partial<HelmetConfiguration>) => void
  /** Where "Log in to add a logo" returns to. */
  returnTo: string
}

/** Rider name, race number and a logo, each with where it goes on the helmet. */
export function StepDetails({ config, update, returnTo }: StepDetailsProps) {
  const nameId = useId()
  const numberId = useId()

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl border border-carbon/10 p-4">
        <label htmlFor={numberId} className="block text-sm font-semibold">
          Race number
        </label>
        <Input
          id={numberId}
          value={config.raceNumber ?? ""}
          maxLength={3}
          onChange={(event) => update({ raceNumber: event.target.value.replace(/[^0-9a-z]/gi, "").toUpperCase() })}
          placeholder="e.g. 29"
          autoComplete="off"
          className="w-28 text-center font-display text-xl font-bold"
        />
        <PlacementPicker
          label="Position"
          options={numberPlacements}
          value={config.numberPosition}
          onChange={(numberPosition) => update({ numberPosition })}
          disabled={!config.raceNumber}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-carbon/10 p-4">
        <label htmlFor={nameId} className="block text-sm font-semibold">
          Name on helmet
        </label>
        <Input
          id={nameId}
          value={config.riderName ?? ""}
          maxLength={24}
          onChange={(event) => update({ riderName: event.target.value.replace(/^\s+/, "") })}
          placeholder="e.g. J. SMITH"
          autoComplete="off"
        />
        <PlacementPicker
          label="Position"
          options={namePlacements}
          value={config.namePosition}
          onChange={(namePosition) => update({ namePosition })}
          disabled={!config.riderName}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-carbon/10 p-4">
        <LogoUpload path={config.logo} onChange={(logo) => update({ logo: logo || undefined })} returnTo={returnTo} />
        <PlacementPicker
          label="Position"
          options={logoPlacements}
          value={config.logoPosition}
          onChange={(logoPosition) => update({ logoPosition })}
          disabled={!config.logo}
        />
      </section>
    </div>
  )
}
