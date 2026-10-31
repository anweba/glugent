---
description: How to write a changeset
---
{ REF BEGIN common/h2 | HEAD="Writing a changeset" }
Create one with `npm run changeset`, or write `.changeset/<short-kebab-name>.md` by hand:

```md
---
"@anweba/glugent-core": minor
"glugent-vscode": patch
---

Plain Markdown entry: what changed for users, and a migration note when it is breaking.
```

- Name every package the change affects. The packages are `@anweba/glugent-core`, `glugent`, `@anweba/glugent-schemas` and `glugent-vscode`. Core and the CLI are a fixed group and always share a version.
- Choose the bump with the versioning table: breaking is minor, a feature or fix is patch, while the packages are 0.x.
- Write for the user of the tool, one change per changeset: what changed and what they must do. Do not mention internal refactors.
- Do not edit `CHANGELOG.md` files, change versions or create tags; the Release workflow does that.
{ REF END common/h2 }
