# Component Sizes Specification
**screek Design System V3 - Brutalist Style**

---

## Color Palette

### Brand Colors (Siesta Tan)

#### Primary - Pink Eggplant
- **Hex**: `#7E2553`
- **RGB**: `rgb(126, 37, 83)`
- **Usage**: Primary buttons, links, active states, borders on hover

#### Secondary - Stellar Strawberry
- **Hex**: `#FF5C80`
- **RGB**: `rgb(255, 92, 128)`
- **Usage**: Secondary buttons, highlights, accents

#### Tertiary - Grauzone
- **Hex**: `#85A3B2`
- **RGB**: `rgb(133, 163, 178)`
- **Usage**: Tertiary buttons, subtle accents

#### Background - Blue Whale
- **Hex**: `#1E3442`
- **RGB**: `rgb(30, 52, 66)`
- **Usage**: Dark mode background, card backgrounds

#### Text - Siesta Tan
- **Hex**: `#E9D8C8`
- **RGB**: `rgb(233, 216, 200)`
- **Usage**: Primary text color in dark mode

#### Accent - Hel Set Black
- **Hex**: `#142838`
- **RGB**: `rgb(20, 40, 56)`
- **Usage**: Darker accents, shadows

### Semantic Colors

#### Success
- **Hex**: `#22c55e`
- **RGB**: `rgb(34, 197, 94)`
- **Usage**: Success messages, positive states

#### Warning
- **Hex**: `#f59e0b`
- **RGB**: `rgb(245, 158, 11)`
- **Usage**: Warning messages, caution states

#### Danger
- **Hex**: `#ef4444`
- **RGB**: `rgb(239, 68, 68)`
- **Usage**: Error messages, destructive actions

#### Info
- **Hex**: `#3b82f6`
- **RGB**: `rgb(59, 130, 246)`
- **Usage**: Information messages, neutral highlights

### Surface Colors (Light Mode)

#### Surface Light 50
- **Hex**: `#F0F9FF` (Aquamarine)
- **RGB**: `rgb(240, 249, 255)`
- **Usage**: Light mode card backgrounds

#### Surface Light 100
- **Hex**: `#E0F2FE`
- **RGB**: `rgb(224, 242, 254)`
- **Usage**: Light mode main background

### Surface Colors (Dark Mode)

#### Surface Dark 900
- **Hex**: `#0c1821`
- **RGB**: `rgb(12, 24, 33)`
- **Usage**: Dark mode card backgrounds

#### Surface Dark 950
- **Hex**: `#030712`
- **RGB**: `rgb(3, 7, 18)`
- **Usage**: Dark mode main background

### Opacity Variations

#### White with Opacity
- **10%**: `rgba(255, 255, 255, 0.1)` - Subtle borders
- **20%**: `rgba(255, 255, 255, 0.2)` - Default borders (dark mode)
- **40%**: `rgba(255, 255, 255, 0.4)` - Labels, placeholders
- **60%**: `rgba(255, 255, 255, 0.6)` - Secondary text

#### Black with Opacity
- **10%**: `rgba(0, 0, 0, 0.1)` - Subtle borders (light mode)
- **20%**: `rgba(0, 0, 0, 0.2)` - Default borders (light mode)
- **40%**: `rgba(0, 0, 0, 0.4)` - Labels, placeholders (light mode)
- **50%**: `rgba(0, 0, 0, 0.5)` - Overlay backgrounds
- **80%**: `rgba(0, 0, 0, 0.8)` - Modal backgrounds
- **90%**: `rgba(0, 0, 0, 0.9)` - Lightbox backgrounds

---

## Component Colors

### Buttons

#### Primary Button
- **Background**: `#7E2553` (primary-400)
- **Text**: `#E9D8C8` (text color)
- **Border**: `#7E2553` (primary-400)
- **Hover Background**: Same with `brightness(0.9)` filter
- **Hover Border**: Same
- **Disabled**: Same with `opacity(0.5)`

#### Secondary Button
- **Background**: `#FF5C80` (secondary-400)
- **Text**: `#E9D8C8` (text color)
- **Border**: `#FF5C80` (secondary-400)
- **Hover Background**: Same with `brightness(0.9)` filter
- **Hover Border**: Same
- **Disabled**: Same with `opacity(0.5)`

#### Ghost Button (Dark Mode)
- **Background**: `transparent`
- **Text**: `#E9D8C8` (text color)
- **Border**: `rgba(255, 255, 255, 0.2)`
- **Hover Background**: `rgba(126, 37, 83, 0.1)` (primary-400/10)
- **Hover Border**: `#7E2553` (primary-400)
- **Disabled**: Same with `opacity(0.5)`

#### Ghost Button (Light Mode)
- **Background**: `transparent`
- **Text**: `#030712` (surface-dark-950)
- **Border**: `rgba(0, 0, 0, 0.2)`
- **Hover Background**: `rgba(126, 37, 83, 0.1)` (primary-400/10)
- **Hover Border**: `#7E2553` (primary-400)
- **Disabled**: Same with `opacity(0.5)`

### Inputs

#### Input (Dark Mode)
- **Background**: `#0c1821` (surface-dark-900)
- **Text**: `#E9D8C8` (surface-light-100)
- **Border**: `rgba(255, 255, 255, 0.2)`
- **Placeholder**: `rgba(255, 255, 255, 0.4)`
- **Focus Border**: `#7E2553` (primary-400)
- **Disabled**: Same with `opacity(0.5)`

#### Input (Light Mode)
- **Background**: `#F0F9FF` (surface-light-50)
- **Text**: `#030712` (surface-dark-950)
- **Border**: `rgba(3, 7, 18, 0.2)` (surface-dark-950/20)
- **Placeholder**: `rgba(0, 0, 0, 0.4)`
- **Focus Border**: `#7E2553` (primary-400)
- **Disabled**: Same with `opacity(0.5)`

### Badges

#### Primary Badge
- **Background**: `rgba(126, 37, 83, 0.1)` (primary-400/10)
- **Text**: `#7E2553` (primary-400)
- **Border**: `#7E2553` (primary-400)

#### Secondary Badge
- **Background**: `rgba(255, 92, 128, 0.1)` (secondary-400/10)
- **Text**: `#FF5C80` (secondary-400)
- **Border**: `#FF5C80` (secondary-400)

#### Success Badge
- **Background**: `rgba(34, 197, 94, 0.1)` (success-400/10)
- **Text**: `#22c55e` (success-400)
- **Border**: `#22c55e` (success-400)

#### Warning Badge
- **Background**: `rgba(245, 158, 11, 0.1)` (warning-400/10)
- **Text**: `#f59e0b` (warning-400)
- **Border**: `#f59e0b` (warning-400)

#### Danger Badge
- **Background**: `rgba(239, 68, 68, 0.1)` (danger-400/10)
- **Text**: `#ef4444` (danger-400)
- **Border**: `#ef4444` (danger-400)

#### Info Badge
- **Background**: `rgba(59, 130, 246, 0.1)` (info-400/10)
- **Text**: `#3b82f6` (info-400)
- **Border**: `#3b82f6` (info-400)

### Cards

#### Card (Dark Mode)
- **Background**: `#0c1821` (surface-dark-900)
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Hover Border**: `#7E2553` (primary-400)

#### Card (Light Mode)
- **Background**: `#F0F9FF` (surface-light-50)
- **Border**: `rgba(3, 7, 18, 0.2)` (surface-dark-950/20)
- **Hover Border**: `#7E2553` (primary-400)

### Progress Bars

#### Linear Progress
- **Container Background**: `rgba(255, 255, 255, 0.1)`
- **Container Border**: `rgba(255, 255, 255, 0.1)`
- **Fill (Primary)**: `#7E2553` (primary-400)
- **Fill (Secondary)**: `#FF5C80` (secondary-400)
- **Fill (Tertiary)**: `#85A3B2` (tertiary-400)

#### Circular Progress
- **Background Circle**: `rgba(255, 255, 255, 0.1)`
- **Progress Circle (Primary)**: `#7E2553` (primary-400)
- **Progress Circle (Secondary)**: `#FF5C80` (secondary-400)
- **Progress Circle (Tertiary)**: `#85A3B2` (tertiary-400)

### Gallery

#### Grid Item
- **Border**: `rgba(255, 255, 255, 0.1)`
- **Hover Border**: `#7E2553` (primary-400)

#### Carousel
- **Main Image Border**: `rgba(255, 255, 255, 0.1)`
- **Thumbnail Border**: `rgba(255, 255, 255, 0.1)`
- **Active Thumbnail Border**: `#7E2553` (primary-400)
- **Navigation Button Background**: `rgba(0, 0, 0, 0.5)`
- **Navigation Button Border**: `rgba(255, 255, 255, 0.2)`
- **Navigation Button Hover Background**: `rgba(0, 0, 0, 0.8)`
- **Navigation Button Hover Border**: `#7E2553` (primary-400)

---

## Buttons

### Small (sm)
- **Padding**: 16px horizontal × 8px vertical
- **Min Width**: 80px
- **Height**: 36px (12px font + 8px top + 8px bottom + 4px top border + 4px bottom border)
- **Font Size**: 12px
- **Font Weight**: 900 (black)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Text Transform**: Uppercase

### Medium (md) - Default
- **Padding**: 24px horizontal × 12px vertical
- **Min Width**: 120px
- **Height**: 46px (14px font + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Font Size**: 14px
- **Font Weight**: 900 (black)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Text Transform**: Uppercase

### Large (lg)
- **Padding**: 32px horizontal × 12px vertical
- **Min Width**: 160px
- **Height**: 46px (14px font + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Font Size**: 14px
- **Font Weight**: 900 (black)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Text Transform**: Uppercase

### Icon Button
- **Padding**: 12px all sides
- **Width**: 44px (20px icon + 12px left + 12px right + 4px left border + 4px right border)
- **Height**: 44px (20px icon + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Icon Size**: 20px
- **Border**: 4px solid
- **Border Radius**: 0px (square)

### Interactive States

#### Hover
- **Transform**: `scale(1.05)` - Aumenta 5%
- **Width**: ~46px (sm), ~48px (md/lg), ~46px (icon) - calculado com scale
- **Height**: ~38px (sm), ~48px (md/lg), ~46px (icon) - calculado com scale
- **Filter**: `brightness(0.9)` - Escurece 10%
- **Border Color**: Mantém a cor original (primary/secondary) ou muda para primary-400 (ghost)
- **Transition**: 300ms ease

#### Active (Pressed)
- **Transform**: `scale(0.95)` - Reduz 5%
- **Width**: ~34px (sm), ~44px (md/lg), ~42px (icon) - calculado com scale
- **Height**: ~34px (sm), ~44px (md/lg), ~42px (icon) - calculado com scale
- **All other properties**: Same as default

#### Disabled
- **Opacity**: 50%
- **Cursor**: not-allowed
- **Pointer Events**: none
- **All other properties**: Same as default

---

## Inputs

### Text Input
- **Padding**: 16px horizontal × 12px vertical
- **Width**: 100% (full width)
- **Height**: 52px (16px font + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Font Size**: 16px
- **Font Weight**: 500 (medium)
- **Border**: 4px solid
- **Border Radius**: 0px (square)

### Interactive States

#### Focus
- **Border Color**: Changes to primary-400 (#7E2553)
- **Outline**: None
- **All other properties**: Same as default

#### Disabled
- **Opacity**: 50%
- **Cursor**: not-allowed
- **Pointer Events**: none
- **All other properties**: Same as default

#### Read Only
- **Background**: Slightly darker/lighter (maintains theme)
- **Cursor**: default
- **All other properties**: Same as default


### With Icon
- **Padding Left**: 48px (for icon space)
- **Icon Position**: 16px from left, vertically centered
- **Icon Size**: 18px

### Label
- **Font Size**: 12px
- **Font Weight**: 900 (black)
- **Margin Bottom**: 8px
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.1em (widest)
- **Opacity**: 40%

---

## Select

### Dropdown
- **Padding**: 16px horizontal × 12px vertical
- **Width**: 100% (full width)
- **Height**: 52px (16px font + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Font Size**: 16px
- **Font Weight**: 500 (medium)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Icon**: ChevronDown 18px, positioned 16px from right

---

## Textarea

### Text Area
- **Padding**: 16px horizontal × 12px vertical
- **Width**: 100% (full width)
- **Height**: 120px (4 rows × 20px line-height + 12px top + 12px bottom + 4px top border + 4px bottom border)
- **Min Height**: 120px
- **Font Size**: 16px
- **Font Weight**: 500 (medium)
- **Line Height**: 1.5 (24px)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Resize**: None

---

## Badges

### Badge
- **Padding**: 12px horizontal × 4px vertical
- **Height**: 26px (10px font + 4px top + 4px bottom + 2px top border + 2px bottom border)
- **Width**: Auto (content + padding)
- **Font Size**: 10px
- **Font Weight**: 900 (black)
- **Border**: 2px solid
- **Border Radius**: 0px (square)
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.1em (widest)

---

## Cards

### Card
- **Padding**: 24px all sides
- **Width**: Variable (depends on layout)
- **Height**: Auto (content + padding)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Min Width**: 200px (recommended)

### Interactive States

#### Hover (if clickable)
- **Border Color**: Changes to primary-400 (#7E2553)
- **Transform**: None
- **Transition**: 300ms ease
- **All other properties**: Same as default

---

## Progress Bars

### Linear Progress - Small
- **Width**: 100% (full width)
- **Height**: 16px (8px bar + 4px top border + 4px bottom border)
- **Bar Height**: 8px (internal)
- **Border**: 4px solid
- **Border Radius**: 0px (square)

### Linear Progress - Medium
- **Width**: 100% (full width)
- **Height**: 20px (12px bar + 4px top border + 4px bottom border)
- **Bar Height**: 12px (internal)
- **Border**: 4px solid
- **Border Radius**: 0px (square)

### Linear Progress - Large
- **Width**: 100% (full width)
- **Height**: 24px (16px bar + 4px top border + 4px bottom border)
- **Bar Height**: 16px (internal)
- **Border**: 4px solid
- **Border Radius**: 0px (square)

### Circular Progress - Default
- **Diameter**: 120px
- **Stroke Width**: 12px
- **Inner Circle**: 96px (diameter - stroke)

### Circular Progress - Small
- **Diameter**: 80px
- **Stroke Width**: 8px
- **Inner Circle**: 64px

### Circular Progress - Medium
- **Diameter**: 100px
- **Stroke Width**: 10px
- **Inner Circle**: 80px

### Step Progress
- **Step Circle**: 40px × 40px
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Connector Line**: 4px height
- **Gap Between Steps**: 8px

---

## Gallery

### Grid Item
- **Aspect Ratio**: 16:9 (video)
- **Border**: 4px solid
- **Border Radius**: 0px (square)
- **Gap**: 16px between items

### Interactive States

#### Hover
- **Border Color**: Changes to primary-400 (#7E2553)
- **Image Transform**: `scale(1.05)` (image only, not container)
- **Cursor**: pointer
- **Transition**: 300ms ease

### Carousel
- **Main Image**: Full width, 16:9 aspect ratio
- **Border**: 4px solid
- **Thumbnail**: 1/6 width, 16:9 aspect ratio
- **Thumbnail Gap**: 8px
- **Navigation Button**: 48px × 48px, border 4px
- **Indicator**: 12px × 12px (active: 32px × 12px)

### Carousel Interactive States

#### Navigation Button Hover
- **Border Color**: Changes to primary-400 (#7E2553)
- **Background**: Changes to black/80% opacity
- **Transition**: 300ms ease

#### Thumbnail Hover
- **Border Color**: Changes to white/20% opacity
- **Transition**: 300ms ease

#### Active Thumbnail
- **Border Color**: primary-400 (#7E2553)


---

## Spacing Scale (8px base)

- **0**: 0px
- **8**: 8px
- **16**: 16px
- **24**: 24px
- **32**: 32px
- **40**: 40px
- **48**: 48px
- **56**: 56px
- **64**: 64px
- **72**: 72px
- **80**: 80px
- **96**: 96px
- **128**: 128px

---

## Border Widths

- **2px**: Badges
- **4px**: Buttons, Inputs, Cards, Progress (default)
- **8px**: Section headers (accent)

---

## Typography Sizes

- **xs**: 12px
- **sm**: 14px
- **base**: 16px
- **lg**: 18px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 30px
- **4xl**: 36px
- **5xl**: 48px
- **6xl**: 60px

---

## Font Weights

- **Regular**: 400
- **Medium**: 500
- **Bold**: 700
- **Black**: 900

---

## Common Measurements

### Section Headers
- **Font Size**: 60px (6xl)
- **Font Weight**: 900 (black)
- **Border Left**: 8px solid (colored)
- **Padding Left**: 24px
- **Margin Bottom**: 48px

### Subsection Labels
- **Font Size**: 12px (xs)
- **Font Weight**: 900 (black)
- **Opacity**: 40%
- **Text Transform**: Uppercase
- **Letter Spacing**: 0.1em (widest)
- **Margin Bottom**: 16px

### Container Padding
- **Small**: 16px
- **Medium**: 24px
- **Large**: 32px

### Grid Gaps
- **Small**: 16px
- **Medium**: 24px
- **Large**: 32px
