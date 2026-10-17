import Link from "next/link"
import { ArrowRight, Camera, ClipboardList, Eye, Layers, PackagePlus, Ruler, ShoppingBag } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { requireShopManager } from "@/lib/auth/session"

export const metadata = { title: "Teamwear guide" }

const steps = [
  {
    icon: PackagePlus,
    title: "Start the product",
    body: "Open Teamwear products and click Add a product. Type the name (for example \"Lucas Racing hoodie\") and the price. It starts hidden, so customers won't see it until you're ready.",
  },
  {
    icon: ClipboardList,
    title: "Add the details",
    body: "Choose a category (Hoodies and sweatshirts, T-shirts and polo shirts, or Caps and accessories) and write a short description: material, fit and care. Save details.",
  },
  {
    icon: Ruler,
    title: "Add a size guide",
    body: "In Size guide, paste a table so customers can pick the right size, for example:\n| Size | Chest (in) | Length (in) |\n| --- | --- | --- |\n| S | 36 | 27 |\n| M | 40 | 28 |",
  },
  {
    icon: Camera,
    title: "Upload photos",
    body: "Add a few clear photos. The first one is the main photo in the shop; drag to reorder. Photos are resized for you.",
  },
  {
    icon: Layers,
    title: "Set sizes, colours and stock",
    body: "In Options, set the option names (Size, and Colour if needed). Add one option per size and colour, each with its own stock, and a price only if it differs (for example XXL). When stock reaches zero it shows as sold out.",
  },
  {
    icon: Eye,
    title: "Put it on sale",
    body: "Switch on On sale and save. Check it on the Teamwear page; customers can now add it to their basket with any other Lucas Racing items.",
  },
  {
    icon: ShoppingBag,
    title: "Orders",
    body: "Orders with teamwear in them appear under Orders. Stock goes down automatically when someone orders, and back up if an order is cancelled. Do a stock count on the product page any time you recount.",
  },
]

/** Wendy's one-page guide to adding a Teamwear product. */
export default async function TeamwearGuidePage() {
  await requireShopManager()
  return (
    <>
      <AdminPageHeader title="Teamwear guide" description="Adding a new Teamwear product, step by step." />
      <div className="space-y-6">
        <ol className="space-y-4">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
              <AdminCard>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-carbon">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {index + 1}. {title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              </AdminCard>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/shop?store=teamwear">
              Go to Teamwear products <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teamwear" target="_blank">
              View the Teamwear shop
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
