
import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "outline" | "secondary";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
    const variants = {
        default: "bg-[#ec4899] text-white",
        secondary: "bg-[#22c55e] text-black",
        outline: "border border-white/20 text-white bg-transparent",
    };

    return (
        <div className={cn(
            "inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )} {...props} />
    );
};


export const CircularProgress = ({ value, label }: { value: number, label?: string }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative h-16 w-16 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90">
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-white/10"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="#ec4899"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500 ease-in-out"
                    />
                </svg>
                <div className="absolute text-xs font-bold text-white">{value}%</div>
            </div>
            {label && <span className="text-xs uppercase tracking-wider text-white/60">{label}</span>}
        </div>
    );
};
