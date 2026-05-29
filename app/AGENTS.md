<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (**Next.js 16.2.1**) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Key:** `middleware.ts` is deprecated. Session handling is in `src/proxy.ts` (exports `proxy()` — the Next.js 16 convention).

All project documentation and architecture is in `../CLAUDE.md` (repo root).
<!-- END:nextjs-agent-rules -->
