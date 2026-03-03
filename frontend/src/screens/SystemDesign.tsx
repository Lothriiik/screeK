
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "../components/game-ui/Button";
import { Input } from "../components/game-ui/Input";
import { Checkbox, Radio, Switch, SelectMock } from "../components/game-ui/Selectors";
import { Badge, CircularProgress } from "../components/game-ui/SmallElements";
import { Cardv2, Alertv2, Accordionv2 } from "../components/game-ui/BigElements";

/**
 * SystemDesign V2
 * 
 * A secluded environment to rebuild the UI Kit from scratch based on strict visual references.
 * 
 * COLORS FROM REFERENCE:
 * Background: #131b2e (Dark Slate)
 * Section Title: #F3E8D2 (Cream/Beige)
 * 
 * PALETTE:
 * - Burgundy: #701a3c
 * - Hot Pink: #ec4899 (Tailwind Pink-500 approx, Reference is #fd4d77)
 * - Muted Blue: #94a3b8 (Slate-400 approx)
 * - Bright Green: #22c55e (Green-500)
 * - Blue: #3b82f6 (Blue-500)
 * - Mustard/Gold: #eab308 (Yellow-500)
 * - Red: #ef4444 (Red-500)
 */

const colors = [
    { name: "Burgundy", value: "#701a3c", class: "bg-[#701a3c]" },
    { name: "Hot Pink", value: "#fd4d77", class: "bg-[#fd4d77]" },
    { name: "Muted Blue", value: "#8faec2", class: "bg-[#8faec2]" },
    { name: "Bright Green", value: "#22c55e", class: "bg-[#22c55e]" },
    { name: "Blue", value: "#3b82f6", class: "bg-[#3b82f6]" },
    { name: "Mustard", value: "#eab308", class: "bg-[#eab308]" },
    { name: "Red", value: "#ef4444", class: "bg-[#ef4444]" },
];

export default function SystemDesign() {
    return (
        <div className="min-h-screen bg-[#131b2e] p-12 font-sans text-[#F3E8D2]">
            <header className="mb-16">
                <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">UI Style Guidelines</h1>
                <p className="opacity-60">System Version 2.0</p>
            </header>

            {/* 01. COLORS */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">01.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Colors</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Main Beige Block */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 h-40 bg-[#F3E8D2] rounded-none flex items-end p-4">
                        <span className="text-[#131b2e] font-bold">Cream / #F3E8D2</span>
                    </div>

                    {/* Palette Grid */}
                    {colors.map((color) => (
                        <div key={color.name} className="flex flex-col gap-2">
                            <div className={cn("h-24 w-full rounded-none shadow-lg", color.class)} />
                            <div className="flex justify-between text-xs opacity-60 uppercase tracking-widest">
                                <span>{color.name}</span>
                                <span>{color.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 02. TYPOGRAPHY */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">02.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Typography</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-8">
                    <div>
                        <h1 className="text-6xl font-bold mb-4 font-display">Heading 1</h1>
                        <p className="text-sm opacity-50 mb-8">Oswald / Bold / 64px</p>

                        <h2 className="text-4xl font-bold mb-4 font-display">Heading 2</h2>
                        <p className="text-sm opacity-50 mb-8">Oswald / Bold / 36px</p>

                        <h3 className="text-2xl font-bold mb-4">Heading 3</h3>
                        <p className="text-sm opacity-50">Inter / Bold / 24px</p>
                    </div>

                    <div className="space-y-6 opacity-80 leading-relaxed">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Suspendisse varius enim in eros elementum tristique.
                            Duis cursus, mi quis viverra ornare, eros dolor interdum nulla,
                            ut commodo diam libero vitae erat.
                        </p>
                        <p className="text-sm">
                            Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet.
                            Nunc ut sem vitae risus tristique posuere.
                        </p>
                    </div>
                </div>
            </section>

            {/* 03. BUTTONS */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">03.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Buttons</h2>
                </div>

                <div className="space-y-12 border-t border-white/10 pt-8">

                    {/* Solid Variants */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                        <div className="text-white/50 text-sm font-mono">VARIANTS</div>
                        <div className="col-span-3 flex flex-wrap gap-6">
                            <Button variant="solid">Primary</Button>
                            <Button variant="solid-maroon">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                        </div>
                    </div>

                    {/* Sizes */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                        <div className="text-white/50 text-sm font-mono">SIZES</div>
                        <div className="col-span-3 flex flex-wrap items-end gap-6">
                            <Button size="sm">Small</Button>
                            <Button size="default">Default</Button>
                            <Button size="lg">Large</Button>
                        </div>
                    </div>

                    {/* States/Icons */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                        <div className="text-white/50 text-sm font-mono">ICONS</div>
                        <div className="col-span-3 flex flex-wrap gap-6">
                            <Button size="icon" variant="solid">
                                <span className="text-xl">+</span>
                            </Button>
                            <Button size="icon" variant="outline">
                                <span className="text-xl">→</span>
                            </Button>
                        </div>
                    </div>

                </div>
            </section>

            {/* 04. TEXTFIELDS */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">04.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Textfields</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-8">
                    <Input placeholder="Enter text..." label="Default Input" />
                    <Input placeholder="Success state" label="Success Input" status="success" defaultValue="Valid Entry" />
                    <Input placeholder="Error state" label="Error Input" status="error" defaultValue="Invalid Entry" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    <div className="col-span-1 opacity-50">
                        <Input placeholder="Disabled" label="Disabled Input" disabled />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-transparent border-2 border-white/20 p-4 h-32 rounded-none text-white/50 text-sm">
                            Textarea (Visual Mockup)
                        </div>
                    </div>
                </div>
            </section>

            {/* 05. SELECTORS */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">05.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Selectors</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-t border-white/10 pt-8">

                    {/* Select */}
                    <div className="col-span-1 md:col-span-2">
                        <SelectMock label="Standard Select" options={["Option 1", "Option 2", "Option 3"]} defaultValue="Option 1" />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-4">Checkboxes</label>
                        <div className="flex items-center gap-3">
                            <Checkbox defaultChecked />
                            <span className="text-sm">Checked</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox />
                            <span className="text-sm">Unchecked</span>
                        </div>
                    </div>

                    {/* Radios */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-4">Radio Buttons</label>
                        <div className="flex items-center gap-3">
                            <Radio name="r1" defaultChecked />
                            <span className="text-sm">Option A</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Radio name="r1" />
                            <span className="text-sm">Option B</span>
                        </div>
                    </div>

                    {/* Switches */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-4">Switches</label>
                        <div className="flex items-center gap-3">
                            <Switch checked={true} />
                            <span className="text-sm">On</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={false} />
                            <span className="text-sm">Off</span>
                        </div>
                    </div>

                </div>
            </section>

            {/* 06. SMALL ELEMENTS */}
            <section className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-pink-500 font-bold text-xl">06.</span>
                    <h2 className="text-2xl font-bold uppercase tracking-wide">Small Elements</h2>
                </div>

                <div className="flex flex-wrap gap-12 border-t border-white/10 pt-8 items-center">

                    {/* Badges */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/50 block">Badges</label>
                        <div className="flex gap-4">
                            <Badge>Design</Badge>
                            <Badge variant="secondary">Success</Badge>
                            <Badge variant="outline">Outline</Badge>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-8">
                        <CircularProgress value={75} label="Loading" />
                        <CircularProgress value={45} label="Uploading" />
                    </div>

                    {/* Avatars (Mock) */}
                    <div className="flex -space-x-2 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#131b2e] bg-white/20 flex items-center justify-center text-xs font-bold">
                                {i}
                            </div>
                        ))}
                    </div>

                </div>
            </section>

        </div>
    );
}
