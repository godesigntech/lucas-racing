import { BuilderTabs } from "@/components/admin/builder/builder-tabs"

/** Every helmet builder page shares one row of step tabs. */
export default function AdminBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BuilderTabs />
      {children}
    </>
  )
}
