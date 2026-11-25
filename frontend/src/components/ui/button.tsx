import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold uppercase tracking-wider transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-none",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary-hover text-[#E9D8C8] shadow-[3px_3px_0px_0px_var(--border)]",
        secondary: "bg-secondary hover:bg-secondary-hover text-[#E9D8C8] shadow-[3px_3px_0px_0px_var(--border)]",
        tertiary: "bg-tertiary hover:bg-tertiary-hover text-[#E9D8C8] shadow-[3px_3px_0px_0px_var(--border)]",
        destructive: "bg-destructive hover:opacity-90 text-[#E9D8C8] shadow-[3px_3px_0px_0px_var(--border)]",
        outline: "border-foreground/40 border-4 bg-background hover:border-primary text-foreground",
        ghost: "bg-transparent hover:bg-foreground/10 text-foreground/70",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 sm:h-12 px-6 text-sm sm:text-base",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-8 text-base sm:text-lg",
        icon: "h-10 w-10 p-0 flex items-center justify-center",
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
        <Slottable>{children}</Slottable>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
