
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    status?: "default" | "success" | "error";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, status = "default", ...props }, ref) => {

        const borderColor =
            status === "success" ? "border-[#22c55e]" :
                status === "error" ? "border-[#ef4444]" :
                    "border-white/20 focus:border-[#ec4899]";

        const textColor =
            status === "success" ? "text-[#22c55e]" :
                status === "error" ? "text-[#ef4444]" :
                    "text-white";

        return (
            <div className="w-full space-y-2">
                {label && <label className={cn("text-xs font-bold uppercase tracking-wider", textColor)}>{label}</label>}
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            "flex h-12 w-full border-2 bg-transparent px-4 py-2 text-sm text-white transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none",
                            borderColor,
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {status === "success" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#22c55e]">✓</div>
                    )}
                </div>
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
