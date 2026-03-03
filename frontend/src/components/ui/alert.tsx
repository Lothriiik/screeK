import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full border-4 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    {
        variants: {
            variant: {
                default: "bg-surface-dark-900 border-white/10 text-foreground",
                success: "border-success-400 bg-success-400/5 text-success-400 [&>svg]:text-success-400",
                warning: "border-warning-400 bg-warning-400/5 text-warning-400 [&>svg]:text-warning-400",
                destructive: "border-danger-400 bg-danger-400/5 text-danger-400 [&>svg]:text-danger-400",
                info: "border-info-400 bg-info-400/5 text-info-400 [&>svg]:text-info-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant, onClose, children, ...props }, ref) => {
        const icons = {
            success: CheckCircle,
            warning: AlertTriangle,
            destructive: XCircle,
            info: Info,
            default: Info,
        }

        const Icon = icons[variant || 'default']

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(alertVariants({ variant }), className)}
                {...props}
            >
                <Icon className="h-5 w-5" />
                <div className="flex-1">{children}</div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 border-2 hover:bg-black/5 transition-all"
                        aria-label="Close alert"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        )
    }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
