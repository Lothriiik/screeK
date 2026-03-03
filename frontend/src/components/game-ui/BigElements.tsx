
import * as React from "react"
import { cn } from "@/lib/utils"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { Button } from "./Button"

export const Cardv2 = ({ className, children, title, image, action, variant = "default" }: { className?: string, children?: React.ReactNode, title?: string, image?: string, action?: string, variant?: "default" | "cream" }) => (
    <div className={cn(
        "border-2 flex flex-col transition-all group",
        variant === "cream" ? "bg-[#F3E8D2] border-transparent text-[#131b2e]" : "bg-[#131b2e] border-white/10 text-white hover:border-[#ec4899]",
        className
    )}>
        {image && (
            <div className="h-48 w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                <img src={image} alt={title} className="h-full w-full object-cover" />
            </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
            {title && <h3 className="text-2xl font-bold uppercase mb-2 font-display tracking-tight">{title}</h3>}
            <div className="opacity-70 text-sm mb-6 flex-1 leading-relaxed">
                {children}
            </div>
            {action && (
                <Button variant={variant === "cream" ? "solid-maroon" : "outline"} size="sm">
                    {action}
                </Button>
            )}
        </div>
    </div>
);

export const Alertv2 = ({ className, title, children, variant = "default" }: { className?: string, title?: string, children?: React.ReactNode, variant?: "default" | "success" | "error" }) => {
    const styles = {
        default: "border-white/20 bg-white/5 text-white",
        success: "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]",
        error: "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]",
    };

    return (
        <div className={cn(
            "border-l-4 p-4 flex gap-4 items-start",
            styles[variant],
            className
        )}>
            <div className="h-6 w-6 shrink-0 mt-0.5 font-bold text-lg">
                {variant === "success" ? "✓" : variant === "error" ? "!" : "i"}
            </div>
            <div>
                {title && <h4 className="font-bold uppercase tracking-wider mb-1">{title}</h4>}
                <div className="text-sm opacity-90">{children}</div>
            </div>
        </div>
    );
};

export const Accordionv2 = ({ items }: { items: { value: string, title: string, content: string }[] }) => (
    <AccordionPrimitive.Root type="single" collapsible className="w-full space-y-4">
        {items.map((item) => (
            <AccordionPrimitive.Item key={item.value} value={item.value} className="border-2 border-white/10 data-[state=open]:border-[#ec4899] transition-colors">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between p-4 font-bold uppercase tracking-wider hover:bg-white/5 transition-all text-left w-full [&[data-state=open]>span]:rotate-180">
                    {item.title}
                    <span className="transition-transform duration-200 text-[#ec4899]">▼</span>
                </AccordionPrimitive.Trigger>
                <AccordionPrimitive.Content className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="p-4 pt-0 opacity-70 leading-relaxed border-t border-white/10 mt-2">
                        {item.content}
                    </div>
                </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
        ))}
    </AccordionPrimitive.Root>
);
