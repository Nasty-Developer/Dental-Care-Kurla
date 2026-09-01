---
name: Importing existing artifacts
description: How to register a copied repository artifact in the Replit workspace
---

When importing a repository that already contains an artifact directory, copied artifact metadata alone does not register the artifact in the workspace. Register a clean artifact first, then overlay the repository's source files while preserving the generated routing metadata.

**Why:** The workspace artifact registry is separate from the repository files, so a copied app can run on its local port yet remain absent from the artifact pane.

**How to apply:** For future repository imports, use a clean slug with `createArtifact`, keep the generated `.replit-artifact/artifact.toml`, and copy the imported app files over it before restarting the managed workflow.