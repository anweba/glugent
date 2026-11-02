<!-- Generated from .glugent by `npm run docs:build`. Edit the sections in .glugent/sections, not this file. -->

# Security policy

## Supported versions

Security fixes go into the latest release of each package: `glugent` (the CLI), `@anweba/glugent-core`, `@anweba/glugent-schemas` and the VS Code extension `anweba.glugent-vscode` (VS Code Marketplace and Open VSX). Update to the latest version before reporting.

## Reporting a vulnerability

Please do **not** open a public issue. Report it privately through GitHub: [report a vulnerability](https://github.com/anweba/glugent/security/advisories/new).

Include what is affected (package and version), how to reproduce it, and the impact you expect. You will get a reply as soon as possible; once a fix is released, the advisory is published and you are credited unless you prefer not to be.

## How releases are protected

- npm packages are published by the Release workflow with npm trusted publishing (OIDC), so no npm token is stored, and they carry provenance.
- The extension is published by the same workflow with tokens kept in a GitHub environment that only `main` may use, and only the publish step can read them.
- The workflows grant each job only the permissions it needs, pin third-party actions to commit SHAs, and install dependencies without running install scripts.
