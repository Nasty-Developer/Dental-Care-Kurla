---
name: OpenAPI email validation
description: Compatibility note for generated Zod schemas in this workspace.
---

Generated validation currently targets a Zod version where the standalone `zod.email()` helper is unavailable. OpenAPI email formats can therefore break library typechecking when codegen emits that helper.

**Why:** A contract generation run failed during library typechecking because the installed Zod package and Orval's format mapping were out of sync.

**How to apply:** For new API contracts, prefer a string with explicit minimum length or a pattern when the server can perform the detailed format check at the route boundary; rerun codegen and the library typecheck after contract changes.