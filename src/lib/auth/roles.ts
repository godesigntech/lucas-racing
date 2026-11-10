import type { StaffRole } from "@/types/account"
import type { StoreId } from "@/types/shop"

/**
 * Shop staff: roles that run one shop's catalogue and nothing else. Teamwear (Wendy) runs
 * the Teamwear shop; Delta (Mary at Delta Racewear) runs the Racewear shop.
 */
const shopStaff: Partial<Record<StaffRole, StoreId>> = {
  teamwear: "teamwear",
  delta: "delta",
}

/** The one shop this role manages, or null for Admin, Sales and customers. */
export function staffShop(role: StaffRole | null | undefined): StoreId | null {
  return (role && shopStaff[role]) ?? null
}
