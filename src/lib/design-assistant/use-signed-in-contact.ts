"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/browser"

export interface QuoteContact {
  name: string
  email: string
  phone: string
}

/**
 * The signed-in customer's name, email and phone, for pre-filling the quote form.
 * Read in the browser so the assistant itself never waits on the session.
 * Null for guests (and until it loads).
 */
export function useSignedInContact(): QuoteContact | null {
  const [contact, setContact] = useState<QuoteContact | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()
        const user = data.session?.user
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle()
        if (cancelled) return
        setContact({
          name: profile?.full_name ?? "",
          email: profile?.email ?? user.email ?? "",
          phone: profile?.phone ?? "",
        })
      } catch {
        // Pre-filling is a convenience; the customer can type their details.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return contact
}
