import { CustomisationPage } from "@/components/layout/header-logo"

/** Customisation pages show the Lucas Racing by HydroKarts logo in the header. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomisationPage />
      {children}
    </>
  )
}
