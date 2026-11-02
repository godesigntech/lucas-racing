import { OptionGroupForm } from "@/components/admin/option-group-form"
import { listAdminOptions } from "@/lib/data/admin"
import type { OptionGroupKey } from "@/types/catalog"

export interface BuilderOptionGroup {
  key: OptionGroupKey
  title: string
  description: string
}

/** Price and on/off lists for some of the builder's option groups (paint colours, lacquer…). */
export async function BuilderOptionGroups({ groups }: { groups: BuilderOptionGroup[] }) {
  const options = await listAdminOptions()
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {groups.map((group) => (
        <OptionGroupForm
          key={group.key}
          group={group.key}
          title={group.title}
          description={group.description}
          options={options.filter((option) => option.group === group.key)}
        />
      ))}
    </div>
  )
}
