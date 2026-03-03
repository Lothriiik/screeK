import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 px-3 py-0.5 text-xs font-black uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary-400 text-primary-400 hover:bg-primary-400 hover:text-white",
        secondary:
          "border-secondary-400 text-secondary-400 hover:bg-secondary-400 hover:text-white",
        destructive:
          "border-danger-400 text-danger-400 hover:bg-danger-400 hover:text-white",
        outline: "border-white/20 text-foreground hover:border-primary-400",
        success: "border-success-400 text-success-400 hover:bg-success-400 hover:text-white",
        warning: "border-warning-400 text-warning-400 hover:bg-warning-400 hover:text-white",
        info: "border-info-400 text-info-400 hover:bg-info-400 hover:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
