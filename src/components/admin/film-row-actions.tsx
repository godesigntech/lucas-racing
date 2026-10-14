"use client"

import { Pencil, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { deleteFilm } from "@/lib/actions/admin/catalog"
import type { Film } from "@/types/catalog"

import { ConfirmDialog } from "./confirm-dialog"
import { FilmDialog } from "./film-dialog"

export function FilmRowActions({ film }: { film: Film }) {
  return (
    <div className="flex justify-end gap-1.5">
      <FilmDialog
        film={film}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      {film.id !== "none" && (
        <ConfirmDialog
          title={`Delete ${film.name}?`}
          description="It will be removed from the configurator. Existing orders keep their details. To hide it for now, switch it off instead."
          confirmLabel="Delete film"
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${film.name}`}>
              <Trash2 />
            </Button>
          }
          onConfirm={async () => {
            const result = await deleteFilm(film.id)
            if (result.ok) toast.success(result.message)
            else toast.error(result.message)
            return result.ok
          }}
        />
      )}
    </div>
  )
}
