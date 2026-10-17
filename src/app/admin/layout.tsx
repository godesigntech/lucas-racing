import { Suspense } from "react"
import type { Metadata } from "next"

import { AdminUnreadProvider } from "@/components/admin/chat/admin-unread-provider"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { Skeleton } from "@/components/ui/skeleton"
import { requireStaff } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminUnreadProvider enabled={!isDemoMode()}>
      <div className="flex min-h-dvh bg-paper">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminGate>{children}</AdminGate>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AdminUnreadProvider>
  )
}

/** Only renders admin pages for staff (each page checks its own role too); everyone else gets a 404. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireStaff()
  return children
}

function AdminPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}
