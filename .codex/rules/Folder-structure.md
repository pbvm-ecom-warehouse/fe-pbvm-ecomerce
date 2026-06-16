# Ecommerce Folder Boundaries

## Required shape

- `src/app`: route composition only
- `src/features/<feature>/components`: feature UI
- `src/features/<feature>/services`: API calls
- `src/features/<feature>/schemas`: input/output validation
- `src/features/<feature>/utils`: pure helpers
- `src/lib`: shared infra only (`api-client`, env, token)
- `src/types`: shared contracts

## Boundary rules

- `app` pages should call feature services/hooks, not raw endpoints.
- Cross-feature imports must be minimal and intentional.
- Shared UI primitives stay under `src/components/ui`.
- Cup designer code belongs under `src/features/cup-designer`.
- Keep Konva/React Three Fiber components client-only and isolated from route files.
