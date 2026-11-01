<!-- Generated from .glugent by `npm run docs:build`. Edit the sections in .glugent/sections, not this file. -->

<p align="center"><img src="https://raw.githubusercontent.com/anweba/glugent/main/packages/vscode/icons/glugent-128.png" alt="Glugent logo" width="96"></p>

# @anweba/glugent-core

The library behind [Glugent](https://github.com/anweba/glugent): it loads a project, renders sections and builds targets. The `glugent` CLI and the VS Code extension are built on it. Use it to build targets from your own code; to build from the command line, install [`glugent`](https://www.npmjs.com/package/glugent) instead.

## Install

```bash
npm i @anweba/glugent-core
```

## Usage

```ts
import { loadProject, validateProject, compileTarget, writeBuild } from "@anweba/glugent-core";

const project = loadProject("glugent.config.json");
for (const problem of validateProject(project)) console.error(`${problem.file}:${problem.line + 1} ${problem.message}`);

for (const target of project.targets) {
  const result = compileTarget(project, target, { overrides: { TONE: "formal" } });
  if (result.diagnostics.length === 0) writeBuild(result);
}
```

## API

| Function | Does |
|---|---|
| `loadProject(configFile)` | reads the config, sections and targets into a `Project`; problems are in `project.diagnostics` |
| `findConfigUp(dir)` | finds `glugent.config.json` in `dir` or a folder above it |
| `validateProject(project)` | every problem in the project, as `Diagnostic[]` |
| `compileTarget(project, target, { overrides })` | builds one target into a `BuildResult` (`outputFile`, `content`, `diagnostics`); `overrides` work like `--set` |
| `writeBuild(result)` / `checkBuild(result)` | writes the result, or compares it with the file on disk (`"current"`, `"stale"` or `"missing"`) |
| `renderTemplate(body, props, options)` | renders one template string |
| `scanTemplate(body)` | the placeholders, slots and syntax errors of a template, for editors |
| `convertMarkdown(text)` | escapes the braces of plain Markdown, as `glugent convert` does |

The types (`Project`, `Target`, `Section`, `BuildResult`, `Diagnostic`, …) are exported too.

## More

- [Glugent on GitHub](https://github.com/anweba/glugent): the full documentation, including the template syntax
- [Examples](https://github.com/anweba/glugent/tree/main/examples), from a first agent to a team setup
- [Changelog](https://github.com/anweba/glugent/blob/main/packages/core/CHANGELOG.md) and [issues](https://github.com/anweba/glugent/issues)
- The packages: [`glugent`](https://www.npmjs.com/package/glugent) (the CLI), [`@anweba/glugent-core`](https://www.npmjs.com/package/@anweba/glugent-core) (the library) and [`@anweba/glugent-schemas`](https://www.npmjs.com/package/@anweba/glugent-schemas) (JSON Schemas)

## License

[MIT](https://github.com/anweba/glugent/blob/main/packages/core/LICENSE) © Antonín Báleš
