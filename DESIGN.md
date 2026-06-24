# Design System — MENUZA AI

## Product Context
- **What this is:** AI-powered restaurant menu digitization SaaS. Restaurant owners photograph their paper menu, AI extracts items in ~7 seconds, they edit in a WYSIWYG editor, and publish as a live QR-code digital menu.
- **Who it's for:** Restaurant owners in Africa (Rwanda-first), primarily mobile, non-technical, running everything themselves. Staff and managers secondarily.
- **Space/industry:** Restaurant tech / menu digitization. Peers: Toast, Square for Restaurants (Western), Orda (African, acquired). No peer currently does locally-grounded design at Western polish level.
- **Project type:** SaaS web app — two distinct surfaces: (1) public landing/marketing, (2) authenticated dashboard + editor + public menu.
- **Memorable thing:** "Built for Africa, not adapted for it." Every design decision serves this.

## Aesthetic Direction
- **Direction:** Editorial/Market-Energy
- **Decoration level:** Intentional — subtle warm grain on surfaces where used, purposeful color blocks, no decorative blobs or abstract shapes. The design feels considered, not decorated.
- **Mood:** The warm authority of a well-laid-out African market poster. Typographically confident. Color-intentional. Photography-grounded. Not cold tech, not vibrant startup chaos. A product that knows where it is.
- **First 3 seconds:** Recognition, not inspiration. A Rwandan restaurant owner should feel *this person knows my situation* — not *wow, this looks cool*. Name their problem before selling the solution.
- **Reference direction:** African editorial print, Kigali market signage energy, printed broadsheet menus.

## Typography
- **Display/Hero:** Plus Jakarta Sans — weight range 300–800, variable, expressive without being decorative. Used for: all headlines, dashboard titles, hero copy, editor UI. Earned its place.
- **Marketing moments:** Syne ExtraBold (800) — compressed authority, African editorial register. Used sparingly: a single number in the hero (e.g. "4,200"), a one-word section anchor. Never more than 2–3 words. Its rarity is the point.
- **Body:** Instrument Sans — replaces Inter. Same legibility profile, warmer curves, wider default tracking that works for dense menu text. The switch is invisible to most users; the cumulative effect is felt. Used for: all body copy, UI labels, form inputs, menu item descriptions.
- **Data/Tables:** Plus Jakarta Sans with `font-variant-numeric: tabular-nums` — reuses existing load, aligns numeric columns cleanly.
- **Code:** JetBrains Mono — admin panels, API references, status codes, technical labels.
- **Loading:** Google Fonts CDN. Import string:
  ```
  https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Syne:wght@700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap
  ```
  Note: `Instrument+Sans` must be added to the existing Google Fonts import in `app/src/app/layout.tsx` and `globals.css` must update `--font-body` to `'Instrument Sans', sans-serif`.
- **Scale:**
  | Level | Size | Weight | Usage |
  |-------|------|--------|-------|
  | Display XL | 4–4.5rem | 800 | Landing hero headline |
  | Display L | 2.5–3rem | 800 | Section headings, restaurant name (public menu) |
  | Headline | 1.5–2rem | 700–800 | Dashboard page titles, card headers |
  | Title | 1.125–1.25rem | 600–700 | Sidebar section labels, modal headers |
  | Body | 1rem | 400–500 | All body copy |
  | Body small | 0.875rem | 400–500 | Secondary text, descriptions, form help |
  | Label | 0.75–0.8rem | 500–600 | All uppercase labels (letter-spacing: 0.08–0.12em) |
  | Caption | 0.7rem | 400–500 | Timestamps, footnotes |
  | Mono | 0.8–0.875rem | 400–500 | Code, technical labels |

## Color
- **Approach:** Balanced — primary accent + dark anchor + warm neutrals. Saffron as a flavor (limited), not a brand color.

| Token | Value | Role |
|-------|-------|------|
| Primary | `#FF6B00` | CTAs, active states, price highlights, the brand color |
| Brand dark | `#a04100` | Hover state for primary, logo variant on light, deep accent |
| Text anchor | `#1A1209` | Primary text, dark surfaces, sidebar background. Warm near-black — reads as black at text sizes, unmistakably warm at display. Replaces neutral gray-950. |
| Surface | `#fcf9f8` | Page background. Warm off-white baseline. |
| Card surface | `#F0EAE0` | Card backgrounds. Lifts off page surface without needing a shadow. |
| Surface high | `#eae7e7` | Hover state on cards, dividers, pressed states |
| Muted | `#8e7164` | Secondary text, placeholders, inactive labels |
| Outline | `#e2bfb0` | Borders, dividers |
| Success | `#1A7A3C` | Published status, order confirmed, positive feedback. Warmer than previous `#006e2a`. |
| Error | `#ba1a1a` | Error states (unchanged) |
| Saffron accent | `#F5C842` | **Limited use only:** CTA hover state, featured item badge backgrounds. A flavor, not a brand color. |
| WhatsApp | `#25D366` | WhatsApp integration elements only (unchanged) |

- **Dark mode strategy:** Replace `--bg` with `#1A1209`, `--card-bg` with `#2a1f12`. Reduce primary saturation 5–10%. Text becomes `#fcf9f8`. Card borders lighten slightly. Saffron accent becomes more prominent in dark — use with extra restraint.
- **Contrast requirements:** All text on surface must pass WCAG AA (4.5:1). Primary orange `#FF6B00` on white fails AA for body text — use brand dark `#a04100` for text-on-light-background orange text.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable (not compact, not spacious — dashboard and menu both need breathing room without wasting vertical space on mobile)
- **Scale:**
  | Token | Value | Use |
  |-------|-------|-----|
  | 2xs | 2px | Micro gaps (icon-to-label) |
  | xs | 4px | Tight UI elements, badge padding |
  | sm | 8px | Default gap, form element internal padding |
  | md | 16px | Standard component padding, list item gaps |
  | lg | 24px | Section internal padding, card padding |
  | xl | 32px | Between major sections within a view |
  | 2xl | 48px | Section separation on landing/marketing |
  | 3xl | 64px | Major section breaks, hero padding |

## Layout
- **Approach:** Hybrid
  - **Marketing/landing:** Creative-editorial — left-heavy, poster-first, grid-breaking. First viewport is a poster, not a document. Photography bleeds to edges with no border radius. Typographic hierarchy does the structural work.
  - **Dashboard/editor/public menu:** Grid-disciplined — strict columns, predictable alignment. Working restaurateurs need clarity under pressure, especially on mobile.
- **Grid:** 12-column. Mobile: 4-col / 16px gutter. Tablet: 8-col / 24px gutter. Desktop: 12-col / 32px gutter.
- **Max content width:** 1200px (dashboard and marketing). Public menu: 640px max.
- **Border radius:**
  | Token | Value | Use |
  |-------|-------|-----|
  | sm | 0.375rem (6px) | Small chips, inline badges |
  | md | 0.75rem (12px) | Buttons, small cards, inputs |
  | lg | 1rem (16px) | Standard cards, modals inner sections |
  | xl | 1.5rem (24px) | Cards, stat blocks, modals |
  | 2xl | 2rem (32px) | Large feature cards, bottom sheets, the primary CTA button |
  | full | 9999px | Pills, avatar circles |

## Motion
- **Approach:** Intentional — entrance animations for key content, meaningful state transitions. No decorative animation. Never block interaction with animation.
- **The AI extraction progress sequence is a feature** — animate it with purpose. The 7-second extraction should feel like watching something intelligent work, not a loading spinner.
- **Easing:**
  | Role | Curve | Use |
  |------|-------|-----|
  | Enter | `ease-out` | Elements appearing, expanding, opening |
  | Exit | `ease-in` | Elements disappearing, collapsing, closing |
  | Move | `ease-in-out` | Position changes, reorders, transitions within a view |
- **Duration:**
  | Token | Range | Use |
  |-------|-------|-----|
  | micro | 50–100ms | Hover states, toggle switches, button presses |
  | short | 150–250ms | Dropdown open/close, tooltip appear |
  | medium | 250–400ms | Panel slide-in, modal enter/exit, page section transitions |
  | long | 400–700ms | Full-page navigation transitions, onboarding step changes |
- **Reduce motion:** Respect `prefers-reduced-motion` — collapse all animations to `opacity` only with `short` duration.

## Risks Taken (and why)
1. **Instrument Sans over Inter** — Inter is what every SaaS ships. Swapping it is invisible to most users but makes the product feel authored, not assembled. The difference is felt in aggregate.
2. **Text-first, left-heavy hero with real African restaurant photography** — breaks from the centered-illustration SaaS norm. Gains immediate recognition from the target audience. Requires a real photo, not stock.
3. **Dense two-column typographic grid for the default public menu template** — vs DoorDash-style card layout. A menu that looks printable, not like a food delivery app. A chef can be proud of it. Degrades gracefully when items have no photos.

## Implementation Notes
- `globals.css` change needed: add `Instrument+Sans` to the Google Fonts `<link>` in `app/src/app/layout.tsx`, update `--font-body` in the `@theme {}` block from `'Inter'` to `'Instrument Sans'`.
- `globals.css` change needed: add `--color-card: #F0EAE0` and `--color-text-anchor: #1A1209` as new tokens. Update text color defaults from neutral `#1b1b1c` to `#1A1209`.
- `globals.css` change needed: update `--color-tertiary` from `#006e2a` to `#1A7A3C` and `--color-tertiary-container` accordingly.
- Syne ExtraBold loads only when needed (landing page) — lazy load via `font-display: optional` or load only on marketing routes.
- The saffron `#F5C842` is not yet in the token system. Add as `--color-accent-saffron: #F5C842` for limited use.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-24 | Initial design system created via /design-consultation | Document + evolve scope. Research confirmed no African restaurant tech competitor has this visual sophistication. Memorable thing: "Built for Africa, not adapted for it." |
| 2026-06-24 | Replace Inter with Instrument Sans for body | Inter is the most overused SaaS body font. Instrument Sans has same legibility with warmer curves and wider tracking suited to menu text. |
| 2026-06-24 | Add Syne ExtraBold for marketing word moments | Compressed authority, African editorial register. Used for 1–2 word callouts only (numbers, section anchors). |
| 2026-06-24 | Add #1A1209 espresso near-black as text anchor | Warm near-black gives the design a consistent temperature. Neutral gray-950 breaks the warmth of the orange+cream palette. |
| 2026-06-24 | Add #F5C842 saffron as limited accent | CTA hover and featured item badges only. References the color temperature of the market (ugali, turmeric). Not a brand color. |
| 2026-06-24 | Refine success green from #006e2a to #1A7A3C | Previous green was too cold (forest ranger). New green has a warmer relationship with the primary orange. |
| 2026-06-24 | Hybrid layout approach | Marketing surface: editorial, poster-first. Dashboard/editor: strict grid. These are different contexts with different cognitive needs. |
