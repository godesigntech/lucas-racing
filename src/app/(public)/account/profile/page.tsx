import { Suspense } from "react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { PasswordForm } from "@/components/account/password-form"
import { ProfileForm } from "@/components/account/profile-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getMyProfile } from "@/lib/data/account"

export const metadata = { title: "Profile" }

export default function AccountProfilePage() {
  return (
    <>
      <AccountPageHeader title="Profile" description="Your details are used to pre-fill checkout." />
      <div className="space-y-6">
        <Suspense fallback={<Skeleton className="h-[34rem] rounded-3xl" />}>
          <ProfileSection />
        </Suspense>
        <PasswordForm />
      </div>
    </>
  )
}

async function ProfileSection() {
  const profile = await getMyProfile()
  return <ProfileForm profile={profile} />
}
