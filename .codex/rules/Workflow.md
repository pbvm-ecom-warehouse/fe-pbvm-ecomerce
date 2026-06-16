# Ecommerce Workflow

1. Verify affected flow (catalog, cart, checkout, orders, cup designer).
2. Keep changes inside relevant feature module.
3. For `CUSTOM_PRINT`, verify design upload/select, 2D editor snapshot, 3D preview fallback, cart `designId/designFile`, and COD blocking.
4. Check API contract against `be-wms-ecom` controllers/DTOs/Swagger before changing service types.
5. Validate:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm test:e2e` for checkout/order/design changes
6. Report impact on:
   - conversion path
   - auth path
   - payment path
   - print/design path
