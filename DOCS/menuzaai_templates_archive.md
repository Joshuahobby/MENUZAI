# MENUZA AI — Templates System (Live)

> **Status: LIVE** — 8 templates are deployed and selectable at `/dashboard/templates`.
> Source: `app/src/app/dashboard/templates/TemplatePreview.tsx`
> Original document was a pre-build Stitch AI handover spec; updated May 2026.

---

## Live Templates (8 total)

All templates are rendered as pure React/inline-style components (no images), scaled to fit any container. Canvas base: 700×990px.

| ID | Name | Style | Google Fonts used |
|---|---|---|---|
| `vintage-parchment` | Vintage Parchment | Warm sepia, decorative borders | Playfair Display |
| `dark-chalkboard` | Dark Chalkboard | Dark bg, chalk-style text, rustic | Oswald |
| `bold-street` | Bold Street | Urban, high-contrast, bold type | Bebas Neue |
| `bistro-split` | Bistro Split | Two-column layout, elegant | Cormorant Garamond |
| `photo-gallery` | Photo Gallery | Full-bleed food photos, modern | Outfit |
| `luxury-gold` | Luxury Gold | Dark + gold accents, premium | Cormorant Garamond |
| `organic-clean` | Organic Clean | Minimal, green accents, health-focused | Outfit |
| `midnight-luxe` | Midnight Luxe | Deep navy, luxury typography | Playfair Display |

---

## How It Works

### Template gallery (`/dashboard/templates`)
- Grid of all 8 templates rendered live with the restaurant's real menu data
- Click any template → confirmation → applies to active menu immediately via `applyTemplate()`

### Print/PDF overlay
- Accessible from the editor
- Template switcher dropdown (all 8 templates)
- Accent color picker
- "Download PDF" → browser print dialog targeting "Save as PDF"
- Share link button

### Template types exported
- `TplData` — `{ restaurantName, website?, phone?, currency?, categories[] }`
- `TplItem` — `{ name, description?, price, image? }`
- `TplCategory` — `{ name, icon?, items[] }`
- `TplStyle` — full style object (colors, fonts, sizes, spacing)
- `DEMO_DATA` — constant used when no real menu data is available

---

## Selection Flow (Actual)

```
/dashboard/templates
    → User browses 8 live-rendered templates
    → Clicks a template card
    → Confirmation prompt ("Apply this template?")
    → applyTemplate(style) called on MenuContext
    → Active menu style updated + auto-saved (1s debounce)
    → User redirected to /dashboard/editor to see result
```

---

## Plan Gating

- All 8 templates are available to **Pro and Business** plan users
- Free and Trial users see templates but are prompted to upgrade on selection
- The `canUseFeature(plan, 'premiumQrTemplates')` check gates access

---

## What Changed vs Original Spec

| Original Stitch spec | Live implementation |
|---|---|
| 4 templates (Classic, Modern, Luxury, Fast Food) | 8 templates, all custom-designed |
| "Free / Premium" badge filter | All templates available on Pro+ (no individual paywalls) |
| Figma components for filter/search | Implemented as simple grid with apply-on-click |
| "Template Selection Confirmation" step | Inline confirmation modal |
| Filter by cuisine type | Not implemented (8 templates are enough variety) |
| Search bar | Not implemented |
