# Ecommerce Decisions

- 2026-05-20: Public sale pages prefer `fetch`; secure flows use shared `axios` client.
- 2026-05-20: Checkout and order mutations remain centralized in feature services.
- 2026-05-20: Compact notes for ecom-only work must be written in this file.
- 2026-06-17: The current cup designer route is `/design-cup` only. The old `/design` route and legacy `src/features/design` implementation were removed from the app surface.
- 2026-06-17: Ecommerce custom-print UI now lives under `src/features/cup-designer`:
  - `react-konva` / `konva` is the 2D source of truth
  - 3D preview uses a sleeve-wrapped cup surface instead of a flat label plane
  - editor scope includes brush `3/5/8/12`, image import limit `0/2`, AI-generated image as a normal artwork layer, print-height slider `40-100%`, and PNG export at `2x`
- 2026-06-17: Cart and checkout contract for ly-in/custom-print is:
  - `FulfillmentType = "STANDARD" | "PRINTED_TEMPLATE" | "CUSTOM_PRINT"`
  - custom-print cart lines carry `cartItemId`, `designId`, and `designFile`
  - custom-print lines do not merge only by `productId`
  - COD is hidden/rejected whenever the cart contains `CUSTOM_PRINT`
- 2026-06-17: Verification snapshot for the current rebuild:
  - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e` passed
  - ecommerce Playwright smoke uses `http://localhost:3103` in `playwright.config.ts` to avoid local port collisions
  - visual smoke confirmed `/design-cup` renders a nonblank 3D canvas and wrapped artwork preview.
