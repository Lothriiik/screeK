
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 rounded-none active:scale-95",
    {
        variants: {
            variant: {
                solid: "bg-[#ec4899] text-white hover:bg-[#db2777] border-2 border-transparent", // Pink default
                "solid-maroon": "bg-[#701a3c] text-white hover:bg-[#50102a] border-2 border-transparent",
                outline: "bg-transparent text-white border-2 border-[#ec4899] hover:bg-[#ec4899] hover:text-white",
                ghost: "bg-transparent text-[#ec4899] hover:bg-[#ec4899]/10",
                link: "text-white underline-offset-4 hover:underline",
            },
            size: {
                default: "h-12 px-8 min-w-[140px]",
                sm: "h-9 px-4 text-xs",
                lg: "h-14 px-10 text-base",
                icon: "h-12 w-12",
            },
        },
        defaultVariants: {
            variant: "solid",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
