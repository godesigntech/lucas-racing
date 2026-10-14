import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersCard } from "@/components/admin/settings/admin-users-card"
import { BusinessForm } from "@/components/admin/settings/business-form"
import { DeliveryMethodsForm } from "@/components/admin/settings/delivery-methods-form"
import { SocialLinksForm } from "@/components/admin/settings/social-links-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminSettings } from "@/lib/data/admin"

export const metadata = { title: "Settings" }

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader title="Settings" description="Business details, social links, delivery options and admin access." />
      <Suspense fallback={<Skeleton className="h-[36rem] rounded-2xl" />}>
        <SettingsEditor />
      </Suspense>
    </>
  )
}

async function SettingsEditor() {
  const { settings, admins, currentEmail } = await getAdminSettings()

  return (
    <Tabs defaultValue="business" className="gap-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="h-11 rounded-full bg-carbon/5 p-1">
          <TabsTrigger value="business" className="rounded-full px-4">
            Business
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-full px-4">
            Social links
          </TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-full px-4">
            Delivery
          </TabsTrigger>
          <TabsTrigger value="admins" className="rounded-full px-4">
            Admins
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="business">
        <BusinessForm settings={settings} />
      </TabsContent>
      <TabsContent value="social">
        <SocialLinksForm links={settings.socialLinks} />
      </TabsContent>
      <TabsContent value="delivery">
        <DeliveryMethodsForm methods={settings.deliveryMethods} />
      </TabsContent>
      <TabsContent value="admins">
        <AdminUsersCard admins={admins} currentEmail={currentEmail} />
      </TabsContent>
    </Tabs>
  )
}
