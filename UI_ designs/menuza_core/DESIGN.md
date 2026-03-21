# Design System Strategy: The Digital Maître d’

## 1. Overview & Creative North Star
The "Digital Maître d’" is the creative North Star of this design system. In the world of high-end hospitality, a Maître d’ is invisible yet essential—providing structure, warmth, and effortless flow. This system rejects the rigid, "boxed-in" aesthetic of traditional SaaS. Instead, it adopts an **Editorial Fluidity**—using expansive white space, intentional asymmetry, and layered depth to make menu management feel as tactile as physical plating.

We move beyond the "template" look by breaking the grid. Elements should overlap slightly, images of food should break container boundaries, and typography should be scaled aggressively to create a sense of hierarchy that feels like a premium lifestyle magazine rather than a database.

## 2. Color Theory & Tonal Depth
This system utilizes a "High-Contrast, Warm-Neutral" palette. We use the energy of Deep Orange to stimulate appetite and the professional weight of Secondary Dark to ground the experience.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Traditional borders create visual noise and "trap" the user's eye.
- **Boundaries:** Define sections solely through background shifts (e.g., a `surface-container-low` card sitting on a `surface` background).
- **Transitions:** Use soft tonal shifts to guide the eye. If a separation is needed, use a 32px vertical gap from the Spacing Scale instead of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine vellum.
- **Base Layer:** `surface` (#fcf9f8).
- **Interactive Layer:** `surface-container-low` (#f6f3f2).
- **Prominent Content:** `surface-container-highest` (#e5e2e1).
*Nesting Example:* Place a `surface-container-lowest` card inside a `surface-container` area to create a "lifted" effect without high-contrast shadows.

### The "Glass & Gradient" Rule
To elevate the "Modern SaaS" feel, use **Glassmorphism** for floating navigation and context menus. Use `surface_variant` at 60% opacity with a `backdrop-blur` of 12px.
- **Signature Textures:** Apply a subtle linear gradient from `primary` (#a04100) to `primary_container` (#ff6b00) on main CTAs to add "soul" and dimension.

## 3. Typography: The Editorial Voice
The type system pairs the geometric confidence of **Poppins** (Heads) with the clinical clarity of **Inter** (Body).

*   **Display & Headlines (Poppins):** Use `display-lg` and `headline-lg` for hero sections and empty states. These should feel authoritative. Use "Tight" letter spacing (-2%) for headlines to give them a modern, punchy look.
*   **Body & Labels (Inter):** Use `body-md` for all primary data entry. Inter’s tall x-height ensures readability on small mobile screens in busy kitchen environments.
*   **The Hierarchy Shift:** Brand identity is conveyed by using exaggerated scale. A `display-sm` heading should often sit next to a `label-sm` metadata tag, creating a sophisticated "Big and Small" editorial contrast.

## 4. Elevation & Depth: Tonal Layering
We achieve hierarchy through **Tonal Layering** rather than structural lines or heavy drop shadows.

*   **The Layering Principle:** Stack `surface-container` tiers. For example, a `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#f6f3f2) background creates a natural, soft lift.
*   **Ambient Shadows:** If an element must "float" (like a mobile FAB or a modal), use a shadow with a 24px-32px blur and 4% opacity. The shadow color must be a tinted version of `on-surface` (#1b1b1c), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border": `outline-variant` (#e2bfb0) at **15% opacity**. 100% opaque borders are strictly forbidden.

## 5. Components & Primitive Styling

### Buttons (The "Plated" Action)
*   **Primary:** Gradient fill (`primary` to `primary_container`), `xl` (1.5rem) corner radius. No border. White text.
*   **Secondary:** `surface-container-highest` fill with `primary` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text, underlined only on hover.

### Input Fields (The "Clean Slate")
*   **Style:** Use `surface-container-low` as the background.
*   **State:** On focus, the background shifts to `surface-container-lowest` with a 1px `primary` "Ghost Border" (20% opacity).
*   **Layout:** Labels should use `label-md` in `on-surface-variant` for a sophisticated, understated look.

### Cards & Lists (The "Menu Items")
*   **Card Styling:** Use `lg` (1rem) or `xl` (1.5rem) corner radius.
*   **No Dividers:** Forbid the use of divider lines between list items. Use `spacing-4` (1rem) of vertical white space or alternating subtle background tints (`surface` vs `surface-container-low`).

### Specialty Components for Restaurant SaaS
*   **Status Badges (The "Freshness" Chip):** Use `tertiary_container` (#00b149) with `on_tertiary_container` (#003a13) text for "Active" or "In Stock" items. Use a pill shape (`full` radius).
*   **Price Tags:** Use Poppins `title-lg` with `primary` color. Price should always feel like a focal point, never an afterthought.

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place high-quality food photography slightly off-center to break the "SaaS grid."
*   **Embrace Space:** If a screen feels "busy," increase the spacing between containers using `spacing-12` (3rem) or `spacing-16` (4rem).
*   **Mobile-First Layering:** On mobile, use bottom sheets that utilize Backdrop Blur to keep the user grounded in their previous context.

### Don't:
*   **No 1px Lines:** Never use a solid, high-contrast line to separate content.
*   **No Pure Blacks:** Avoid `#000000`. Use `secondary` (#5f5e5e) or `on-surface` (#1b1b1c) for text to maintain a premium, soft feel.
*   **No Sharp Corners:** Every interactive element must have at least a `DEFAULT` (0.5rem) radius to maintain the "approachable Canva" aesthetic.