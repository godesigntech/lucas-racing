import { NextResponse, type NextRequest } from "next/server"

import { createPublicClient } from "@/lib/supabase/server"

/**
 * "Customise and order at Delta": counts the click, then sends the visitor to the
 * product on Delta's site with referral tags. Works without JavaScript.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: product } = await supabase.from("shop_products").select("id").eq("slug", slug).eq("store_id", "delta").eq("is_active", true).maybeSingle()
  const fallback = new URL("/racewear", request.url)
  if (!product) return NextResponse.redirect(fallback, 302)

  const { data: externalUrl } = await supabase.rpc("record_external_click", { p_product_id: product.id })
  if (!externalUrl || !/^https:\/\//.test(externalUrl)) return NextResponse.redirect(fallback, 302)

  const target = new URL(externalUrl)
  if (!target.searchParams.has("utm_source")) {
    target.searchParams.set("utm_source", "lucasracing")
    target.searchParams.set("utm_medium", "referral")
    target.searchParams.set("utm_campaign", "racewear")
  }
  return NextResponse.redirect(target, 302)
}
