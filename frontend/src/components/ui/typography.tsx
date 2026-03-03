import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const typographyVariants = cva("", {
    variants: {
        variant: {
            h1: "scroll-m-20 text-6xl font-black uppercase tracking-tighter leading-none",
            h2: "scroll-m-20 text-5xl font-black uppercase tracking-tighter leading-none",
            h3: "scroll-m-20 text-4xl font-black uppercase tracking-tight leading-none",
            h4: "scroll-m-20 text-3xl font-black uppercase tracking-tight leading-none",
            h5: "scroll-m-20 text-2xl font-black uppercase tracking-tight leading-none",
            h6: "scroll-m-20 text-xl font-black uppercase tracking-tight leading-none",
            p: "leading-7 [&:not(:first-child)]:mt-6",
            blockquote: "mt-6 border-l-8 border-primary-400 pl-6 italic font-bold",
            code: "relative px-[0.3rem] py-[0.2rem] font-mono text-sm border-2 border-primary-400 bg-primary-400/10",
            lead: "text-xl text-muted-foreground font-bold",
            large: "text-lg font-bold",
            small: "text-sm font-medium leading-none",
            muted: "text-sm text-muted-foreground",
        },
    },
    defaultVariants: {
        variant: "p",
    },
})

export interface TypographyProps
    extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
    as?: React.ElementType
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
    ({ className, variant, as, children, ...props }, ref) => {
        // Determina o componente base
        const defaultElement = variant?.startsWith("h") ? variant : "p"
        const Comp = (as || defaultElement) as React.ElementType

        return (
            <Comp
                className={cn(typographyVariants({ variant }), className)}
                ref={ref}
                {...props}
            >
                {children}
            </Comp>
        )
    }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }
