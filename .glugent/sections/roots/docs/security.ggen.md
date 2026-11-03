---
description: SECURITY.md of the repository - how to report a vulnerability
---
{ REF repo/generated-note }

{ REF BEGIN common/h1 | HEAD="Security policy" }
{ REF BEGIN common/h2 | HEAD="Supported versions" }
Security fixes go into the latest release of each package: `glugent` (the CLI), `@anweba/glugent-core`, `@anweba/glugent-schemas` and the VS Code extension `anweba.glugent-vscode` (VS Code Marketplace and Open VSX). Update to the latest version before reporting.
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="Reporting a vulnerability" }
Please do **not** open a public issue. Report it privately through GitHub: [report a vulnerability]({REPO_URL}/security/advisories/new).

Include what is affected (package and version), how to reproduce it, and the impact you expect. You will get a reply as soon as possible; once a fix is released, the advisory is published and you are credited unless you prefer not to be.
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="How releases are protected" }
- npm packages are published by the Release workflow with npm trusted publishing (OIDC), so no npm token is stored, and they carry provenance.
- The extension is built in a job without secrets and published from a GitHub environment that only `main` may use and that needs a reviewer's approval. Both the VS Code Marketplace and Open VSX use trusted publishing (OIDC), so no publish token is stored.
- The workflows grant each job only the permissions it needs, pin third-party actions to commit SHAs, and install dependencies without running install scripts.
{ REF END common/h2 }
{ REF END common/h1 }
