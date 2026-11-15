---
name: Warm Creator Flow
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets everyday content creators, solo entrepreneurs, and small business owners who feel overwhelmed by dense marketing suites. The visual tone is encouraging, effortlessly breezy, and delightfully tactile—eliminating technical social media jargon in favor of clear, human terminology (e.g., "Ready to Share", "Draft Idea", "Next Up").

The aesthetic blends **Modern Friendly Minimalism** with **Soft Tactile Surfaces**:
- Ultra-clean canvases with warm undertones to eliminate clinical digital fatigue.
- Generous internal padding and pillowy card contours that invite direct touch interaction.
- Punchy, optimistic micro-accents paired with calm, pastel status indicators.
- Frictionless navigation characterized by low cognitive overhead, open breathing room, and self-evident interactive affordances.

## Colors

The palette establishes an airy, reliable workspace anchored by clean whites and slate-tinted canvas backdrops, accented with expressive, vibrant signals for platform scheduling and publishing status.

- **Primary (`#6366F1` - Electric Indigo):** The core brand driver used for high-impact actions like "Publish Now", timeline creation, active tab states, and focus rings.
- **Secondary (`#10B981` - WhatsApp Emerald):** Dedicated channel identity and success affirmations; handles WhatsApp automation status, successful queue dispatches, and connected profile health.
- **Tertiary (`#F59E0B` - Sunlit Amber):** Reserves attention for drafts, scheduled queues awaiting media review, and friendly celebration triggers.
- **Neutral (`#64748B` - Warm Slate):** Governs structural body typography, low-emphasis borders, and supporting metadata, set against a primary canvas tone of `#F8FAFC` and elevated cards of pure `#FFFFFF`.
- **Pastel Badge Tints:** Tinted 10–15% alphas of primary, emerald, and amber paired with high-contrast text ensure glanceable status tracking without visual noise.

## Typography

Typography relies entirely on **Plus Jakarta Sans** to unify geometric precision with warm, approachable open counters and humanized curves. This ensures long editing sessions remain comfortable while headlines convey friendly optimism.

- **Headlines:** Set with confident semi-bold and bold weights with subtle negative tracking, making screen titles feel organized and approachable.
- **Body:** Open line-height ratios preserve effortless scanning of captions, AI reel prompt tips, and schedule previews.
- **Labels:** Reserved for badges, pill chips, and bottom bar navigation, using medium-to-bold weights to guarantee accessibility against tinted pastel surfaces.

## Layout & Spacing

The layout philosophy centers on a responsive **fluid grid** customized for handheld ergonomics. The primary workspace prioritizes single-thumb access, large tapping targets, and generous lateral gutters.

- **Mobile Viewports (<640px):** Single-column workflow using `margin-mobile` (16px) with an 8px baseline rhythm. Interactive elements maintain a minimum 44px tap target height. Reel preview feeds adopt vertical swipe stacks.
- **Tablet / Split Screen (640px - 1024px):** 6-column fluid structure where the composer stays pinned to the left and live multichannel previews stay anchored on the right.
- **Desktop Dashboard (>1024px):** 12-column fixed-max layout (max-width 1280px) centered with `margin` (24px) gutters to display week/month calendar grids without visual crowding.

## Elevation & Depth

Visual hierarchy uses **tonal layer separation and ambient, colored drop shadows** instead of harsh dividing lines:

- **Base Layer (Canvas):** Colored `#F8FAFC`. Houses empty-state graphics and section backgrounds.
- **Layer 1 (Cards & Media Panels):** Solid `#FFFFFF` elevated via a soft ambient shadow: `0 4px 20px -2px rgba(100, 116, 139, 0.08)`. Outlines use an ultra-soft border of `1px solid rgba(226, 232, 240, 0.8)`.
- **Layer 2 (Floating Action Triggers & Sheets):** Botton sheets and sticky "Create Post" action bars carry a buoyant elevation: `0 12px 32px -4px rgba(99, 102, 241, 0.12)`.
- **Layer 3 (Overlays & Toasts):** Pure white floats with subtle indigo-tinted perimeter glow: `0 20px 40px -8px rgba(15, 23, 42, 0.14)`.

## Shapes

The shape system employs roundedness level `2` (0.5rem base radius) to establish a friendly, handheld contour that softens the UI.

- **Pills (`rounded-full`):** Category tags, filter chips, social account switchers, and primary CTA buttons.
- **Cards & Sheets (`rounded-lg` / 1rem, `rounded-xl` / 1.5rem):** Post preview cards, calendar day cells, and reel timeline blocks use 16px to 24px corner curves, giving the interface a tactile, modular look.
- **Media Containers:** Image and video reel thumbnails share the 16px radius, preserving harmony across the workspace.

## Components

### Buttons
- **Primary:** Full pill-shaped CTA with `#6366F1` background, white label, and subtle hover/press depth (`box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25)`).
- **Secondary / Channel Action:** Soft tinted pills (e.g., `#10B981` at 12% alpha with solid `#047857` text for quick WhatsApp triggers).
- **Ghost:** Borderless button with `#64748B` label transitioning to a light `#F1F5F9` background on touch.

### Chips & Badges
- **Status Pills:** Compact rounded tags using pastel fills:
  - *Scheduled:* Soft Indigo fill (`#EEF2FF`), Indigo text (`#4F46E5`).
  - *Published / Sent:* Soft Emerald fill (`#ECFDF5`), Emerald text (`#059669`).
  - *Draft:* Soft Amber fill (`#FFFBEB`), Amber text (`#B45309`).
- **Account Switcher Chips:** Floating 36px circular avatar badges stacked with micro platform indicators (Instagram, WhatsApp, TikTok).

### Lists & Feed Items
- Borderless list groupings resting within white container cards. Rows are separated by 8px of empty space rather than hairline dividers, maintaining an uncluttered, breathable structure.

### Input Fields & Caption Editor
- Floating inputs with `#F8FAFC` fill, turning pure `#FFFFFF` with an indigo accent border (`2px solid #6366F1`) on focus.
- Generous padding (`space-md`) and integrated emoji and hashtag pill shortcuts docked directly above the keyboard area.

### Cards
- **Post / Reel Card:** Crisp white surface with 16px rounded corners, ambient drop shadow, top status bar with platform icon, central media preview, and one-tap quick-schedule controls at the base.

### Specialized: Reel Timeline Scrubbers
- Rounded capsule-shaped frame sliders with emerald playheads and smooth touch handles, designed for zero-lag trimming on mobile viewports.