# Ecommerce Data Fetching

## Use `fetch`

- Public storefront reads:
  - product list
  - product detail
  - campaign/read-only content
- Prefer server-side `fetch` for cacheable read pages.

## Use `axios`

- Authenticated and secure flows:
  - login/logout
  - cart submit (if protected)
  - checkout/order create
  - payment-related endpoints
- Must use shared `src/lib/api-client.ts` for token/refresh handling.

## Constraints

- Do not create ad-hoc axios instances in feature files.
- Do not store refresh logic outside `src/lib/api-client.ts`.
