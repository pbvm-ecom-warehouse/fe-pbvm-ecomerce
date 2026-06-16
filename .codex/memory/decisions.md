# Ecommerce Decisions

- 2026-05-20: Public sale pages prefer `fetch`; secure flows use shared `axios` client.
- 2026-05-20: Checkout and order mutations remain centralized in feature services.
- 2026-05-20: Compact notes for ecom-only work must be written in this file.
- 2026-06-16: Ecommerce owns the 2D/3D cup designer; warehouse must not implement 3D cup design.
- 2026-06-16: `CUSTOM_PRINT` requires `designId` + `designFile` in cart/order payloads and blocks COD.
- 2026-06-16: Ecommerce frontend targets `/api/shop`, unwraps `{ data, meta }`, and refreshes through `/auth/refresh`.
- 2026-06-16: For ecommerce UI work, apply the installed frontend skills (`frontend-design-ui-ux`, `generic-react-ux-designer`, `component-interface-design`, `react-shadcn`) as a polish pass for attractive storefront/design-tool UX, smooth interactions, accessible states, mobile fallback, and screenshot verification. Repo-local `.codex`, root `.codex`, `AGENTS.md`, and backend contracts stay higher priority.
- 2026-06-16: Ecommerce dev server runs on `http://localhost:3102` via `pnpm dev`; do not use the Next default `3000` because warehouse has its own frontend.
- 2026-06-16: Ecommerce storefront rebuild uses `origin/FE_Ecomerce` only as a visual reference. Keep repo-local `.codex`, current service/contracts, `pnpm`, and feature-folder architecture from `main`; do not merge branch-only structure such as `package-lock.json`, `src/features/design`, fake AI flows, or route files packed with large client UI logic.
- 2026-06-16: Current ecommerce UI baseline was rebuilt on branch `codex/rebuild-ecommerce-ui-fe-style` and committed locally as `4dd662e` (`feat: rebuild ecommerce storefront UI`). Home/product/cart/checkout/auth were restyled, `/design` now redirects to `/design-cup`, and layout shell now includes the shared storefront header/footer/hero treatment.
- 2026-06-16: Cup designer persistence stays 2D-first. `createCupDesignFileSnapshot()` now serializes `cupConfig` + `layers`, the 2D artboard remains the source of truth for `designFile`, and the 3D cup preview is visual confirmation only.
- 2026-06-16: Verification snapshot for commit `4dd662e`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` passed. Additional Playwright visual smoke verified desktop/mobile render, nonblank 3D canvas, hidden COD for custom-print carts, and visible COD for ready-stock checkout.
