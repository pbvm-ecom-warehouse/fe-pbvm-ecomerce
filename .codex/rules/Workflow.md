# Ecommerce Workflow

1. Verify affected flow (catalog, cart, checkout, orders).
2. Keep changes inside relevant feature module.
3. Validate:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm test:e2e` for checkout/order-risk changes
4. Report impact on:
   - conversion path
   - auth path
   - payment path
