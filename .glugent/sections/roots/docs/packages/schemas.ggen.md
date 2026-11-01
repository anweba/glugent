---
description: README of @anweba/glugent-schemas (the JSON Schemas) on npm
---
{ REF repo/generated-note }

{ REF parts/logo }

{ REF BEGIN common/h1 | HEAD="@anweba/glugent-schemas" }
JSON Schemas for the files of [{PROJECT}]({REPO_URL}), for completion and validation in your editor.
{ REF END common/h1 }

{ REF BEGIN common/h2 | HEAD="Files" }
| Schema | For |
|---|---|
| `glugent-config.schema.json` | `glugent.config.json` |
| `target.schema.json` | target files: `*.target.ggen.json`, `*.agent.ggen.json`, `*.doc.ggen.json` |
| `agent.schema.json` | the older name of `target.schema.json` |
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="Usage" }
The Glugent VS Code extension applies these schemas on its own. In other editors, point `$schema` at them, without installing anything:

{!```json
{
  "$schema": "https://unpkg.com/@anweba/glugent-schemas/target.schema.json",
  "name": "hello",
  "sections": ["hello"]
}
```!}

Or install the package (`npm i -D @anweba/glugent-schemas`) and use `"./node_modules/@anweba/glugent-schemas/target.schema.json"`.
{ REF END common/h2 }

{ REF parts/package-links | DIR="packages/schemas" }
