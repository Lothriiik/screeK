
import * as React from "react"
import { cn } from "@/lib/utils"

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <div className="relative flex items-center">
        <input type="checkbox" className="peer h-5 w-5 appearance-none border-2 border-white/20 bg-transparent checked:bg-[#ec4899] checked:border-[#ec4899] rounded-none cursor-pointer transition-all" ref={ref} {...props} />
        <svg className="absolute left-0 top-0 h-5 w-5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
));
Checkbox.displayName = "Checkbox";

export const Radio = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <div className="relative flex items-center">
        <input type="radio" className="peer h-5 w-5 appearance-none border-2 border-white/20 bg-transparent checked:border-[#ec4899] rounded-full cursor-pointer transition-all" ref={ref} {...props} />
        <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-[#ec4899] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
    </div>
));
Radio.displayName = "Radio";

export const Switch = React.forwardRef<HTMLButtonElement, { checked?: boolean; onCheckedChange?: (checked: boolean) => void; className?: string }>(({ checked, onCheckedChange, className }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "w-12 h-6 border-2 transition-colors relative cursor-pointer",
            checked ? "border-[#ec4899] bg-[#ec4899]/10" : "border-white/20 bg-transparent",
            className
        )}
        ref={ref}
    >
        <span className={cn(
            "block w-3 h-3 bg-[#ec4899] absolute top-1 transition-transform",
            checked ? "left-[calc(100%-16px)]" : "left-1",
            !checked && "bg-white/20"
        )} />
    </button>
));
Switch.displayName = "Switch";

export const SelectMock = ({ label, options, defaultValue }: { label?: string, options: string[], defaultValue?: string }) => (
    <div className="w-full space-y-2">
        {label && <label className="text-xs font-bold uppercase tracking-wider text-white">{label}</label>}
        <div className="relative">
            <div className="flex h-12 w-full items-center justify-between border-2 border-white/20 bg-transparent px-4 py-2 text-sm text-white rounded-none cursor-pointer hover:border-[#ec4899]">
                <span>{defaultValue || "Select option"}</span>
                <span className="text-[#ec4899]">▼</span>
            </div>
            {/* Visual Dropdown (Static for Design Page) */}
            <div className="absolute top-full left-0 w-full bg-[#131b2e] border-2 border-[#ec4899] border-t-0 z-10 mt-1 hidden group-hover:block">
                {options.map(opt => (
                    <div key={opt} className="px-4 py-2 hover:bg-[#ec4899] hover:text-white cursor-pointer text-sm">
                        {opt}
                    </div>
                ))}
            </div>
        </div>
    </div>
);
