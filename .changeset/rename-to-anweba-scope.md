---
"@anweba/glugent-core": minor
"@anweba/glugent-cli": minor
"@anweba/glugent-schemas": minor
"glugent-vscode": patch
---

Move the packages to the `@anweba` npm scope.

Migration: replace the old names in your `package.json` and imports.

| Old | New |
|---|---|
| `@glugent/core` | `@anweba/glugent-core` |
| `@glugent/cli` | `@anweba/glugent-cli` |
| `@glugent/schemas` | `@anweba/glugent-schemas` |

The `glugent` command and the `glugent-vscode` extension keep their names.
