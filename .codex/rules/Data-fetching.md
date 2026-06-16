# Ecommerce Data Fetching

## Use `fetch`

- Public storefront reads:
  - product list
  - product detail
  - campaign/read-only content
- Prefer server-side `fetch` for cacheable read pages.
- Public fetch must unwrap `{ data, meta }` and preserve `/api/shop`.

## Use `axios`

- Authenticated and secure flows:
  - login/logout
  - cart submit (if protected)
  - checkout/order create
  - design upload/export or reuse
  - payment-related endpoints
- Must use shared `src/lib/api-client.ts` for token/refresh handling.

## Constraints

- Do not create ad-hoc axios instances in feature files.
- Do not store refresh logic outside `src/lib/api-client.ts`.
- Use `/auth/refresh`, not stale refresh-token routes.
- Branch on `error.code`, not Vietnamese message text.
- Read pagination from `meta.pagination`.
