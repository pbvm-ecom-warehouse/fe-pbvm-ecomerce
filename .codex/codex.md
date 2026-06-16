# E-commerce Codex Context

Repo: `fe-pbvm-ecomerce`

This file defines repo-specific rules that override shared `@WDP/.codex` when needed.

## Scope

- Customer-facing storefront
- Catalog browsing
- `CUSTOM_PRINT` cup designer for upload/select/edit/preview design
- Cart and checkout
- Order tracking
- Auth for B2B and B2C customers

## Priorities

1. Conversion flow stability: browse -> cart -> checkout -> order
2. Fast public read pages
3. Correct design-to-cart snapshots for ly-in
4. Secure authenticated mutations

## Shared Contract

- Root `@WDP/.codex` is the baseline.
- API source of truth: `be-wms-ecom` source and `/api/shop/docs`.
- Ecommerce API prefix: `/api/shop`.
- Success envelope: `{ data, meta }`; pagination is `meta.pagination`.
- Refresh endpoint: `/auth/refresh`.
- `CUSTOM_PRINT` requires `designId` + `designFile`; `PRINTED_TEMPLATE` does not.
- 3D belongs to the ecommerce cup designer only, not warehouse.

## Rule Set

- Workflow: `rules/Workflow.md`
- Code quality: `rules/Code-quality.md`
- Fetching strategy: `rules/Data-fetching.md`
- Folder boundaries: `rules/Folder-structure.md`
- Ecommerce cup designer: `@WDP/.codex/rules/Ecommerce-cup-designer.md`

## Local Memory

- Decisions: `memory/decisions.md`

## Compaction Rule

- For changes only in this repo, compact into:
  - `fe-pbvm-ecomerce/.codex/memory/decisions.md`
- For changes spanning both repos, compact into:
  - `@WDP/.codex/memory/decisions.md`
