# Changelog

All notable changes to MENUZA AI are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.1] - 2026-06-26

### Changed
- Hero pill copy: "AI Waiter (Pro+)" → "AI Waiter included" — removes paywall signal before visitors understand the 14-day trial covers Pro features
- Mobile snippet card surface: `bg-white` → warm `#F0EAE0` so the card sits cohesively on the warm page background instead of feeling cold
- Mobile snippet text rendered smaller (0.35 rem) and with a subtle blur, making it clearly illustrative rather than broken/illegible content

### Fixed
- Trust signal avatar: restored three stacked "K" circles with `-ml-1.5` overlap so the visual matches the plural "Restaurants … trust MENUZA AI" copy (was a single avatar)

## [0.1.0] - 2026-06-25

### Added
- Initial public release: AI-powered SaaS menu digitization platform
- Menu editor with WYSIWYG 2-panel layout (sidebar + device-frame canvas)
- AI menu extraction from images via OpenRouter / Anthropic
- AI Waiter conversational ordering widget on public menus
- WhatsApp checkout flow and QR code poster generator
- PawaPay payment integration for plan upgrades and food orders
- 14-day free trial with Pro features; Paid plans: Pro (35,000 RWF) and Business (89,000 RWF)
- Admin dashboard: metrics, restaurant management, AI config, audit log, broadcast emails
- Real-time staff orders panel with Supabase broadcast
- Web Push notifications, PWA / Service Worker
- Vercel deployment targeting `cdg1` (Paris) region
