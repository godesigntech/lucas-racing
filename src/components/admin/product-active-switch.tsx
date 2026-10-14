"use client"

import { setProductActive } from "@/lib/actions/admin/catalog"

import { ActiveSwitch } from "./active-switch"

export function ProductActiveSwitch({ productId, name, isActive }: { productId: string; name: string; isActive: boolean }) {
  return (
    <ActiveSwitch
      checked={isActive}
      label={`Show ${name} on the website`}
      onToggle={(next) => setProductActive(productId, next)}
    />
  )
}
