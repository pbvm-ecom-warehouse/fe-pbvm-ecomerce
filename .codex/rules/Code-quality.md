# Ecommerce Code Quality

- Keep product and pricing logic deterministic and testable.
- Avoid mixing UI rendering with request/response mapping logic.
- All user-input payloads must use `zod` schemas.
- Never duplicate cart total calculation across files.
- All order/checkout side effects must be isolated in `features/*/services`.
