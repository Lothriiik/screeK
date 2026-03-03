/**
 * CinePass UI Kit - Standalone Reference
 * 
 * Esta página contém todos os componentes do CinePass UI Kit v3.0
 * Use este arquivo como referência para copiar e colar componentes em outros projetos.
 * 
 * Componentes incluídos:
 * - Design Tokens (cores, tipografia, espaçamento)
 * - Buttons (Primary, Secondary, Ghost)
 * - Textfields (Input, Select, Textarea)
 * - Selectors (Checkbox, Radio, DatePicker, Breadcrumbs, Pagination)
 * - Small Elements (Badge, Progress, Tag, Tooltip, Toggle, Spinner)
 * - Big Elements (Card, Modal, Gallery, Carousel)
 * - Alert (Success, Warning, Danger, Info)
 */

import { useState } from 'react'
import {
    Search, Film, Plus, ArrowRight, AlertTriangle, CheckCircle
} from 'lucide-react'
import { Switch } from '../components/ui/switch'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Breadcrumbs } from '../components/custom/breadcrumbs'
import { Pagination } from '../components/custom/pagination'
import { CircularProgress } from '../components/custom/circular-progress'
import { Progress } from '../components/ui/progress'
import { Tag } from '../components/custom/tag'
import { Alert } from '../components/ui/alert'
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../components/ui/dialog'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Gallery } from '../components/custom/gallery'



export default function UIKitReference() {
    const [isDark, setIsDark] = useState(true);

    return (
        <div className={`min-h-screen font-sans transition-colors ${isDark ? 'bg-surface-dark-950 text-surface-light-100' : 'bg-surface-light-100 text-surface-dark-950'}`}>
            {/* BRUTALIST HEADER */}
            {/* BRUTALIST HEADER */}
            <header className={`sticky top-0 z-50 border-b-4 border-primary-400 transition-colors ${isDark ? 'bg-surface-dark-950' : 'bg-surface-light-100'}`}>
                <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 bg-primary-400 flex items-center justify-center border-4 border-primary-400">
                            <span className="text-white font-black text-xl">CP</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                                CinePass <span className="text-primary-400">UI Kit</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-0.5">Design System v3.0 - Reference</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className={`px-4 py-1 border-4 font-black uppercase text-xs tracking-tight hover:border-primary-400 transition-colors ${isDark ? 'border-white/20' : 'border-black/20'}`}
                    >
                        {isDark ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-8 py-16 space-y-24">

                {/* 01. DESIGN TOKENS */}
                <section>
                    <div className="mb-12 border-l-8 border-primary-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">01. Design Tokens</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Variables & Foundation</p>
                    </div>

                    {/* Colors */}
                    <div className="mb-12">
                        <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Color Variables</div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="border-4 border-white/10 p-6 hover:border-primary-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Primary</div>
                                    <div className="h-32 border-4 border-primary-400 mb-4" style={{ backgroundColor: '#7E2553' }}></div>
                                    <div className="text-2xl font-black font-mono">#7E2553</div>
                                    <div className="text-xs opacity-40 mt-2">{'{color.primary}'}</div>
                                </div>
                                <div className="border-4 border-white/10 p-6 hover:border-secondary-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Secondary</div>
                                    <div className="h-32 border-4 border-secondary-400 mb-4" style={{ backgroundColor: '#FF5C80' }}></div>
                                    <div className="text-2xl font-black font-mono">#FF5C80</div>
                                    <div className="text-xs opacity-40 mt-2">{'{color.secondary}'}</div>
                                </div>
                                <div className="border-4 border-white/10 p-6 hover:border-tertiary-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Tertiary</div>
                                    <div className="h-32 border-4 border-tertiary-400 mb-4" style={{ backgroundColor: '#85A3B2' }}></div>
                                    <div className="text-2xl font-black font-mono">#85A3B2</div>
                                    <div className="text-xs opacity-40 mt-2">{'{color.tertiary}'}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="border-4 border-white/10 p-6 hover:border-success-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Success</div>
                                    <div className="h-24 border-4 border-success-400 mb-4" style={{ backgroundColor: '#22c55e' }}></div>
                                    <div className="text-lg font-black font-mono">#22c55e</div>
                                </div>
                                <div className="border-4 border-white/10 p-6 hover:border-warning-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Warning</div>
                                    <div className="h-24 border-4 border-warning-400 mb-4" style={{ backgroundColor: '#f59e0b' }}></div>
                                    <div className="text-lg font-black font-mono">#f59e0b</div>
                                </div>
                                <div className="border-4 border-white/10 p-6 hover:border-danger-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Danger</div>
                                    <div className="h-24 border-4 border-danger-400 mb-4" style={{ backgroundColor: '#ef4444' }}></div>
                                    <div className="text-lg font-black font-mono">#ef4444</div>
                                </div>
                                <div className="border-4 border-white/10 p-6 hover:border-info-400 transition-colors">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Info</div>
                                    <div className="h-24 border-4 border-info-400 mb-4" style={{ backgroundColor: '#3b82f6' }}></div>
                                    <div className="text-lg font-black font-mono">#3b82f6</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Typography Variables */}
                    <div className="mb-12">
                        <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Typography Variables</div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-4 border-white/10 p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Family:</span>
                                        <span className="font-mono">Inter</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Weight Regular:</span>
                                        <span className="font-mono">400</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Weight Medium:</span>
                                        <span className="font-mono">500</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Weight Bold:</span>
                                        <span className="font-mono">700</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Weight Black:</span>
                                        <span className="font-mono">900</span>
                                    </div>
                                </div>
                            </div>
                            <div className="border-4 border-white/10 p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Size xs:</span>
                                        <span className="font-mono">12px</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Size sm:</span>
                                        <span className="font-mono">14px</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Size base:</span>
                                        <span className="font-mono">16px</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Size lg:</span>
                                        <span className="font-mono">18px</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Font Size xl:</span>
                                        <span className="font-mono">20px</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spacing & Border Variables */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="border-4 border-white/10 p-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Spacing Scale</div>
                            <div className="space-y-2">
                                {[0, 8, 16, 24, 32, 40, 48, 64, 80, 96, 128].map(size => (
                                    <div key={size} className="flex items-center gap-4">
                                        <div className="w-16 text-xs font-mono opacity-60">{size}px</div>
                                        <div className="h-6 bg-primary-400" style={{ width: `${size}px` }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-4 border-white/10 p-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Border Variables</div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs opacity-60 mb-2">Border Radius: 0px (Brutalist)</div>
                                    <div className="h-16 border-4 border-primary-400 bg-primary-400/10"></div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-2">Border Width: 2px</div>
                                    <div className="h-16 border-2 border-tertiary-400"></div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-2">Border Width: 4px (Primary)</div>
                                    <div className="h-16 border-4 border-primary-400"></div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-2">Border Width: 8px (Accent)</div>
                                    <div className="h-16 border-8 border-secondary-400"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 02. BUTTONS */}
                <section>
                    <div className="mb-12 border-l-8 border-tertiary-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">02. Buttons</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Variants, Sizes, States & Icons</p>
                    </div>

                    {/* PRIMARY BUTTONS */}
                    <div className="border-4 border-white/10 p-8 mb-8">
                        <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Primary</div>

                        {/* Sizes */}
                        <div className="mb-8">
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Sizes</div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button size="sm" variant="default">Small</Button>
                                <Button size="default" variant="default">Medium</Button>
                                <Button size="lg" variant="default">Large</Button>
                            </div>
                        </div>

                        {/* States */}
                        <div className="mb-8">
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">States</div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button size="default" variant="default">Default</Button>
                                <Button size="default" variant="default" className="brightness-90">Hover</Button>
                                <Button size="default" variant="default" className="scale-95">Active</Button>
                                <Button size="default" variant="default" disabled>Disabled</Button>
                            </div>
                        </div>

                        {/* With Icons */}
                        <div >
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">With Icons</div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button size="default" variant="default" icon={<Plus size={16} />}>Add Item</Button>
                                <Button size="default" variant="default" icon={<ArrowRight size={16} />}>Continue</Button>
                                <Button size="icon" variant="default"><Plus size={20} /></Button>
                            </div>
                        </div>
                    </div>

                    {/* SECONDARY & GHOST BUTTONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" >
                        <div className="border-4 border-white/10 p-8">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Secondary</div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <Button size="sm" variant="secondary">Small</Button>
                                    <Button size="default" variant="secondary">Medium</Button>
                                    <Button size="lg" variant="secondary">Large</Button>
                                </div>
                            </div>
                        </div>

                        <div className="border-4 border-white/10 p-8">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Ghost</div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <Button size="sm" variant="ghost">Small</Button>
                                    <Button size="default" variant="ghost">Medium</Button>
                                    <Button size="lg" variant="ghost">Large</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 03. ALERTS */}
                <section>
                    <div className="mb-12 border-l-8 border-secondary-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">03. Alerts</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Feedback Messages</p>
                    </div>

                    <div className="border-4 border-white/10 p-8 space-y-6">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Success Alert</div>
                            <Alert variant="success" title="Success!">
                                Your changes have been saved successfully.
                            </Alert>
                        </div>

                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Warning Alert</div>
                            <Alert variant="warning" title="Warning">
                                This action may have unintended consequences. Please review before proceeding.
                            </Alert>
                        </div>

                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Danger Alert</div>
                            <Alert variant="destructive" title="Error">
                                An error occurred while processing your request. Please try again.
                            </Alert>
                        </div>

                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Info Alert</div>
                            <Alert variant="info" title="Information">
                                This feature is currently in beta. Some functionality may be limited.
                            </Alert>
                        </div>

                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Closable Alert</div>
                            <Alert
                                variant="info"

                                title="Dismissible"
                                onClose={() => alert('Alert closed!')}
                            >
                                You can close this alert by clicking the X button.
                            </Alert>
                        </div>
                    </div>
                </section>

                {/* 04. TEXTFIELDS */}
                <section>
                    <div className="mb-12 border-l-8 border-success-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">04. Textfields</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Input Variants & States</p>
                    </div>

                    <div className="border-4 border-white/10 p-8">
                        <div className="space-y-8">
                            {/* Input with Label and Status States */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Input with Label & Status</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Default State</label>
                                        <Input placeholder="Enter your name..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Success State</label>
                                        <Input placeholder="john@example.com" className="border-success-400" />
                                        <p className="text-xs text-success-400 font-bold">Email is valid</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Warning State</label>
                                        <Input placeholder="Enter password..." className="border-warning-400" />
                                        <p className="text-xs text-warning-400 font-bold">Password is weak</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Error State</label>
                                        <Input placeholder="Enter username..." className="border-destructive" />
                                        <p className="text-xs text-destructive font-bold">Username already taken</p>
                                    </div>
                                </div>
                            </div>

                            {/* Input Variants */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Input Variants</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">With Icon</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 opacity-40 ml-1 mt-0.5" size={16} />
                                            <Input placeholder="Search..." className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Disabled State</label>
                                        <Input placeholder="Disabled input" disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">No Label</label>
                                        <Input placeholder="No label example..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Password Input</label>
                                        <Input type="password" placeholder="Enter password..." />
                                    </div>
                                </div>
                            </div>

                            {/* Select and Textarea */}
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Select & Textarea</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Select Option</label>
                                        <Select>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Option 1</SelectItem>
                                                <SelectItem value="2">Option 2</SelectItem>
                                                <SelectItem value="3">Option 3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold opacity-60">Textarea</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full border-4 border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Type your message..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 05. SELECTORS */}
                <section>
                    <div className="mb-12 border-l-8 border-danger-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">05. Selectors</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Checkbox, Radio, Breadcrumbs & Pagination</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="border-4 border-white/10 p-8">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Checkbox</div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="c1" defaultChecked />
                                    <label htmlFor="c1" className="text-sm font-medium">Accept terms and conditions</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="c2" />
                                    <label htmlFor="c2" className="text-sm font-medium">Subscribe to newsletter</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="c3" disabled />
                                    <label htmlFor="c3" className="text-sm font-medium opacity-50">Disabled option</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="c4" disabled defaultChecked />
                                    <label htmlFor="c4" className="text-sm font-medium opacity-50">Disabled checked</label>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Breadcrumbs */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Breadcrumbs</div>
                        </div>

                        <div className="border-4 border-white/10 p-8 space-y-6">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Default</div>
                                <Breadcrumbs

                                    items={[
                                        { label: 'Movies', href: '#' },
                                        { label: 'Action', href: '#' },
                                        { label: 'The Matrix' }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Pagination</div>
                        </div>

                        <div className="border-4 border-white/10 p-8 space-y-8">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-4">Few Pages</div>
                                <Pagination

                                    currentPage={2}
                                    totalPages={5}
                                    onPageChange={(page) => console.log('Page:', page)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Tabs</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <Tabs defaultValue="account" className="w-[400px]">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="account">Account</TabsTrigger>
                                    <TabsTrigger value="password">Password</TabsTrigger>
                                </TabsList>
                                <TabsContent value="account">
                                    <div className="p-4 border-2 border-white/5 bg-white/5 mt-4">
                                        <h3 className="font-bold mb-2">Account</h3>
                                        <p className="text-sm opacity-60">Make changes to your account here.</p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="password">
                                    <div className="p-4 border-2 border-white/5 bg-white/5 mt-4">
                                        <h3 className="font-bold mb-2">Password</h3>
                                        <p className="text-sm opacity-60">Change your password here.</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </section>

                {/* 06. SMALL ELEMENTS */}
                <section>
                    <div className="mb-12 border-l-8 border-warning-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">06. Small Elements</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Badge, Progress, Tags & More</p>
                    </div>

                    {/* Badges */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Badges</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <div className="flex flex-wrap gap-4">
                                <Badge variant="default">Primary</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="success">Success</Badge>
                                <Badge variant="warning">Warning</Badge>
                                <Badge variant="destructive">Danger</Badge>
                                <Badge variant="info">Info</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="mb-12" >
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Progress Bar</div>
                        </div>
                        <div className="space-y-8">
                            <div className="border-4 border-white/10 p-8">
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-6">Linear Progress</div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs mb-2">Upload Progress</div>
                                        <Progress value={50} className="bg-white/10" />
                                    </div>
                                    <div>
                                        <div className="text-xs mb-2">Processing</div>
                                        <Progress value={75} className="bg-white/10 h-6" />
                                    </div>
                                    <div>
                                        <Progress value={30} className="bg-white/10 h-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-4 border-white/10 p-8">
                                <div className="text-xs font-bold uppercase tracking-wide opacity-60 mb-6">Circular Progress</div>
                                <div className="flex flex-wrap gap-8 items-end">
                                    <div className="flex flex-col items-center gap-2">
                                        <CircularProgress value={75} isDark={isDark} />
                                        <span className="text-xs opacity-60">Default</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <CircularProgress value={50} isDark={isDark} size={100} color="text-secondary-400" />
                                        <span className="text-xs opacity-60">Secondary</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <CircularProgress value={90} isDark={isDark} size={60} strokeWidth={4} color="text-tertiary-400" />
                                        <span className="text-xs opacity-60">Tertiary</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-12" >
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Chip / Tag</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <div className="flex flex-wrap gap-3">
                                <Tag>Simple Tag</Tag>
                                <Tag onClose={() => { }}>Closable Tag</Tag>
                                <Tag>Another Tag</Tag>
                            </div>
                        </div>
                    </div>

                    {/* Switch */}
                    <div className="mb-12" >
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Switch</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <div className="flex gap-8">
                                <div className="flex items-center gap-3">
                                    <Switch id="s1" />
                                    <label htmlFor="s1" className="text-sm font-bold">Airplane Mode</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch id="s2" defaultChecked />
                                    <label htmlFor="s2" className="text-sm font-bold">Notifications</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch id="s3" disabled />
                                    <label htmlFor="s3" className="text-sm font-bold opacity-50">Disabled</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 07. BIG ELEMENTS */}
                <section>
                    <div className="mb-12 border-l-8 border-info-400 pl-6">
                        <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">07. Big Elements</h2>
                        <p className="text-xl font-bold uppercase tracking-wide opacity-40">Card & Modal</p>
                    </div>

                    {/* Cards */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Card</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold mb-2">Card Title</h3>
                                        <p className="text-sm opacity-60">This is a basic card component with padding and shadow.</p>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="p-6">
                                        <Film className="mb-4 text-primary-400" size={32} />
                                        <h3 className="text-lg font-bold mb-2">With Icon</h3>
                                        <p className="text-sm opacity-60">Cards can contain icons and various content.</p>
                                    </div>
                                </Card>
                                <Card>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold mb-4">Interactive</h3>
                                        <Button size="sm" variant="default">Action</Button>
                                    </div>
                                </Card >
                            </div>
                        </div>
                    </div>


                    {/* Modals */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Modals</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <div className="flex flex-wrap gap-6">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="default">Open Modal</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Profile</DialogTitle>
                                            <DialogDescription>
                                                Make changes to your profile here. Click save when you're done.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <label className="text-right text-sm font-bold opacity-60">Name</label>
                                                <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <label className="text-right text-sm font-bold opacity-60">Username</label>
                                                <Input id="username" defaultValue="@pedroduarte" className="col-span-3" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="default">Save changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive">Delete Account</Button>
                                    </DialogTrigger>
                                    <DialogContent variant="destructive">
                                        <DialogHeader>
                                            <div className="flex flex-col items-center gap-4 mb-2">
                                                <div className="h-12 w-12 rounded-full bg-danger-400/20 flex items-center justify-center">
                                                    <AlertTriangle className="text-danger-400" size={24} />
                                                </div>
                                                <DialogTitle className="text-danger-400">Are you sure?</DialogTitle>
                                            </div>
                                            <DialogDescription>
                                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="secondary">Cancel</Button>
                                            <Button variant="destructive">Yes, Delete Account</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="default" className="bg-success-400 border-success-400 hover:bg-success-400/90 text-white">Success Action</Button>
                                    </DialogTrigger>
                                    <DialogContent variant="success">
                                        <DialogHeader>
                                            <div className="flex flex-col items-center gap-4 mb-2">
                                                <div className="h-12 w-12 rounded-full bg-success-400/20 flex items-center justify-center">
                                                    <CheckCircle className="text-success-400" size={24} />
                                                </div>
                                                <DialogTitle className="text-success-400">Project Published!</DialogTitle>
                                            </div>
                                            <DialogDescription>
                                                Your project has been successfully published and is now live for everyone to see.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="default" className="bg-success-400 border-success-400 hover:bg-success-400/90">View Project</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Accordion */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Accordion</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Is it accessible?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. It adheres to the WAI-ARIA design pattern.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Is it styled?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. It comes with default styles that matches the other components' aesthetic.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Is it animated?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. It's animated by default, but you can disable it if you prefer.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="mb-12">
                        <div className="mb-6">
                            <div className="text-xs font-black uppercase tracking-widest opacity-40">Gallery</div>
                        </div>
                        <div className="border-4 border-white/10 p-8">
                            <Gallery
                                images={[
                                    "https://image.tmdb.org/t/p/original/8tZYtu9erp5ferjon57xNh6h5M.jpg",
                                    "https://image.tmdb.org/t/p/original/61eQ4q9y2rNlFv68uZ94K4rEw4.jpg",
                                    "https://image.tmdb.org/t/p/original/2LG71d17F86Yp2vH10hF8kQ4.jpg"
                                ]}
                                columns={3}
                            />
                        </div>
                    </div>

                </section>
            </main>

            {/* FOOTER */}
            <footer className={`border-t-4 border-primary-400 py-12 ${isDark ? 'bg-surface-dark-950' : 'bg-surface-light-100'}`
            }>
                <div className="max-w-7xl mx-auto px-8 text-center">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">
                        CinePass UI Kit v3.0 • Design System Reference
                    </p>
                    <p className="text-xs opacity-40 mt-2">
                        Copie e cole componentes deste arquivo para seus projetos
                    </p>
                </div>
            </footer>
        </div >
    );
}
