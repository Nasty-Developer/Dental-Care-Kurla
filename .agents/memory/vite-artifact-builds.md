---
name: Vite artifact builds
description: Build-time constraints and HTML URL behavior for this workspace's Vite artifacts.
---

Artifact Vite builds require the same PORT and BASE_PATH environment values supplied by the workflow; without them, config loading fails before the app is built. Root-relative URLs such as `/` in HTML asset-bearing attributes can also be interpreted by Vite as local files or directories. Use runtime-generated absolute URLs when a value depends on the served origin.

**Why:** The preview workflow supplies these values, but ad-hoc production builds do not. A canonical URL pointing at `/` caused Vite to read the workspace root as an asset directory.

**How to apply:** For local build verification, provide the artifact's workflow PORT and BASE_PATH. Keep origin-dependent SEO URLs in runtime scripts unless a real production origin is available.