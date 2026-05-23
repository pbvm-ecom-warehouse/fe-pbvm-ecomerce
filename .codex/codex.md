# E-commerce Codex Context

Repo: `fe-pbvm-ecomerce`

This file defines repo-specific rules that override shared `@WDP/.codex` when needed.

## Scope

- Customer-facing storefront
- Catalog browsing
- Cart and checkout
- Order tracking
- Auth for B2B and B2C customers

## Priorities

1. Conversion flow stability: browse -> cart -> checkout -> order
2. Fast public read pages
3. Secure authenticated mutations

## Rule Set

- Workflow: `rules/Workflow.md`
- Code quality: `rules/Code-quality.md`
- Fetching strategy: `rules/Data-fetching.md`
- Folder boundaries: `rules/Folder-structure.md`

## Local Memory

- Decisions: `memory/decisions.md`

## Compaction Rule

- For changes only in this repo, compact into:
  - `fe-pbvm-ecomerce/.codex/memory/decisions.md`
- For changes spanning both repos, compact into:
  - `@WDP/.codex/memory/decisions.md`
