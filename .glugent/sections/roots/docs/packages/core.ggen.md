---
description: README of @anweba/glugent-core (the library) on npm
---
{ REF repo/generated-note }

{ REF parts/logo }

{ REF BEGIN common/h1 | HEAD="@anweba/glugent-core" }
The library behind [{PROJECT}]({REPO_URL}): it loads a project, renders sections and builds targets. The `glugent` CLI and the VS Code extension are built on it. Use it to build targets from your own code; to build from the command line, install [`glugent`](https://www.npmjs.com/package/glugent) instead.
{ REF END common/h1 }

{ REF BEGIN common/h2 | HEAD="Install" }
```bash
npm i @anweba/glugent-core
```
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="Usage" }
{!```ts
import { loadProject, validateProject, compileTarget, writeBuild } from "@anweba/glugent-core";

const project = loadProject("glugent.config.json");
for (const problem of validateProject(project)) console.error(`${problem.file}:${problem.line + 1} ${problem.message}`);

for (const target of project.targets) {
  const result = compileTarget(project, target, { overrides: { TONE: "formal" } });
  if (result.diagnostics.length === 0) writeBuild(result);
}
```!}
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="API" }
| Function | Does |
|---|---|
| `loadProject(configFile)` | reads the config, sections and targets into a `Project`; problems are in `project.diagnostics` |
| `findConfigUp(dir)` | finds `glugent.config.json` in `dir` or a folder above it |
| `validateProject(project)` | every problem in the project, as `Diagnostic[]` |
| `compileTarget(project, target, {{ overrides }})` | builds one target into a `BuildResult` (`outputFile`, `content`, `diagnostics`); `overrides` work like `--set` |
| `writeBuild(result)` / `checkBuild(result)` | writes the result, or compares it with the file on disk (`"current"`, `"stale"` or `"missing"`) |
| `renderTemplate(body, props, options)` | renders one template string |
| `scanTemplate(body)` | the placeholders, slots and syntax errors of a template, for editors |
| `convertMarkdown(text)` | escapes the braces of plain Markdown, as `glugent convert` does |

The types (`Project`, `Target`, `Section`, `BuildResult`, `Diagnostic`, …) are exported too.
{ REF END common/h2 }

{ REF parts/package-links | DIR="packages/core" }
