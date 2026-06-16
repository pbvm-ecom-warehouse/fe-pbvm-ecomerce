# Ecommerce Code Quality

- Keep product and pricing logic deterministic and testable.
- Avoid mixing UI rendering with request/response mapping logic.
- All user-input payloads must use `zod` schemas.
- Never duplicate cart total calculation across files.
- All order/checkout side effects must be isolated in `features/*/services`.
- `CUSTOM_PRINT` cart items must carry `designId` and immutable `designFile` snapshot.
- `PRINTED_TEMPLATE` is treated as stock-ready catalog product, not custom print.
- 2D editor state is source of truth; 3D preview is visual confirmation.
- Canvas/WebGL paths need loading and non-WebGL fallback states.
