# Ecommerce Decisions

- 2026-05-20: Public sale pages prefer `fetch`; secure flows use shared `axios` client.
- 2026-05-20: Checkout and order mutations remain centralized in feature services.
- 2026-05-20: Compact notes for ecom-only work must be written in this file.
- 2026-06-16: Ecommerce owns the 2D/3D cup designer; warehouse must not implement 3D cup design.
- 2026-06-16: `CUSTOM_PRINT` requires `designId` + `designFile` in cart/order payloads and blocks COD.
- 2026-06-16: Ecommerce frontend targets `/api/shop`, unwraps `{ data, meta }`, and refreshes through `/auth/refresh`.
- 2026-06-16: For ecommerce UI work, apply the installed frontend skills (`frontend-design-ui-ux`, `generic-react-ux-designer`, `component-interface-design`, `react-shadcn`) as a polish pass for attractive storefront/design-tool UX, smooth interactions, accessible states, mobile fallback, and screenshot verification. Repo-local `.codex`, root `.codex`, `AGENTS.md`, and backend contracts stay higher priority.
- 2026-06-16: Ecommerce dev server runs on `http://localhost:3102` via `pnpm dev`; do not use the Next default `3000` because warehouse has its own frontend.
