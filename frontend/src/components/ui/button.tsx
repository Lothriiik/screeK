import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-black uppercase tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:scale-105 border-4 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-400 text-white border-primary-400 hover:brightness-90",
        destructive: "bg-danger-400 text-white border-danger-400 hover:brightness-90",
        outline: "border-white/20 bg-transparent hover:border-primary-400 hover:bg-primary-400/10",
        secondary: "bg-secondary-400 text-white border-secondary-400 hover:brightness-90",
        ghost: "border-2 border-transparent hover:bg-white/5 hover:text-white hover:border-white/20",
        link: "text-primary-400 underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-11 px-6 min-w-[120px] text-sm", // Standard (44px)
        sm: "h-9 px-4 text-xs min-w-[80px]", // Small (36px)
        lg: "h-14 px-8 min-w-[140px] text-base", // Large (56px) needs to be taller but not too wide
        icon: "h-11 w-11", // Icon Button match default
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
