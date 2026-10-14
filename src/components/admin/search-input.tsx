"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

interface SearchInputProps {
  placeholder: string
  label: string
}

/** Debounced search box that keeps its value in ?q= so results are shareable. Resets paging. */
export function SearchInput({ placeholder, label }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function update(next: string) {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.trim()) params.set("q", next.trim())
      else params.delete("q")
      params.delete("page")
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
    }, 300)
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor="admin-search" className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id="admin-search"
        type="search"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-full pl-10 pr-10"
      />
      <span className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center">
        {pending ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Searching" />
        ) : value ? (
          <button
            type="button"
            onClick={() => update("")}
            className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-carbon"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  )
}
