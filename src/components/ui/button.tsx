import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_rgb(249_83_18/0.75)] hover:bg-[#ff6b2e]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-carbon-3",
        outline:
          "border-foreground/15 bg-transparent text-foreground hover:border-foreground/40 hover:bg-foreground/5",
        inverse:
          "border-white/20 bg-white/5 text-paper hover:border-white/40 hover:bg-white/10",
        ghost: "text-foreground hover:bg-foreground/5",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "h-auto rounded-none px-0 text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-7 text-[0.95rem]",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
