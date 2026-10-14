"use client"

import { saveFilm } from "@/lib/actions/admin/catalog"
import type { Film } from "@/types/catalog"

import { ActiveSwitch } from "./active-switch"

export function FilmActiveSwitch({ film }: { film: Film }) {
  return (
    <ActiveSwitch
      checked={film.isActive}
      label={`Offer ${film.name} to customers`}
      onToggle={(isActive) => saveFilm({ ...film, isActive }, "update")}
    />
  )
}
