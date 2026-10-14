import { Suspense } from "react"
import { Plus } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FilmActiveSwitch } from "@/components/admin/film-active-switch"
import { FilmDialog } from "@/components/admin/film-dialog"
import { FilmRowActions } from "@/components/admin/film-row-actions"
import { FilmSwatch } from "@/components/helmet/film-swatch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAdminFilms } from "@/lib/data/admin"
import { formatMoney } from "@/lib/format"

export const metadata = { title: "Films" }

export default function AdminFilmsPage() {
  return (
    <>
      <AdminPageHeader
        title="Films"
        description="The hydro-dip film library customers choose from. Each film's price is added to the helmet."
        actions={
          <FilmDialog
            trigger={
              <Button>
                <Plus /> Add film
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <FilmList />
      </Suspense>
    </>
  )
}

async function FilmList() {
  const films = await listAdminFilms()

  return (
    <AdminCard flush>
      <div className="overflow-x-auto">
        <Table className="min-w-[36rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Film</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {films.map((film) => (
              <TableRow key={film.id}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <span className="size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-carbon/10">
                      {film.pattern === "none" ? (
                        <span className="block size-full bg-gradient-to-br from-zinc-200 to-zinc-400" />
                      ) : (
                        <FilmSwatch film={film.pattern} tint="#6b7280" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold">{film.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{film.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{film.category}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {film.price ? formatMoney(film.price) : <span className="font-normal text-muted-foreground">Free</span>}
                </TableCell>
                <TableCell>
                  <FilmActiveSwitch film={film} />
                </TableCell>
                <TableCell className="pr-5">
                  <FilmRowActions film={film} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminCard>
  )
}
