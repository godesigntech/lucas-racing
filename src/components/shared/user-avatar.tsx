import { cn } from "@/lib/utils"

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2)).toUpperCase()
}

interface UserAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

/** Initials avatar; we don't store profile photos. */
export function UserAvatar({ name, size = "md", className }: UserAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-carbon font-display font-bold uppercase text-brand",
        size === "sm" && "size-8 text-sm",
        size === "md" && "size-10 text-base",
        size === "lg" && "size-14 text-xl",
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
