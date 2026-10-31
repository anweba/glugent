---
description: Packages, folders and architecture of the Glugent repository
---
## Development

```
packages/
  core/     @anweba/glugent-core  – config, discovery, parsing, validation, compilation (single source of truth)
  cli/      @anweba/glugent-cli   – thin wrapper: `glugent build|validate|list`
  vscode/   glugent-vscode – thin wrapper: highlighting, diagnostics, completion, hover, build commands
  schemas/  JSON Schemas for glugent.config.json and target files
examples/basic/
```

The CLI and the extension both call `@anweba/glugent-core`; nothing is implemented twice. In the CLI, `cli.ts` (the `Cli` class) wires `Arguments`, `Reporter` and one `Command` subclass per subcommand in `commands/`; add a command by subclassing `Command` and registering it in `COMMANDS`. Inside `@anweba/glugent-core` (`packages/core/src`), each folder is one stage, and the public functions (`loadProject`, `compileAgent`, `validateProject`, `renderTemplate`, `scanTemplate`) are thin wrappers over the classes:

| Folder | Classes | Job |
|---|---|---|
| `template/` | `TemplateScanner`, `ConditionParser`, `TemplateRenderer`, `TemplateAnalyzer` | the template language: source → pieces → text, or placeholders and errors for editors (`grammar.ts` holds the regular expressions) |
| `project/` | `ProjectLoader`, `SectionParser`, `TargetParser`, `SectionResolver` | read the config, sections and targets from disk |
| `build/` | `TargetCompiler`, `ProjectValidator` | glue a target's sections together, validate, write the output |

The extension (`packages/vscode/src`) is a set of small `Feature` classes, each registering itself with VS Code; `extension.ts` only wires them together:

| File | Job |
|---|---|
| `project-store.ts` (`ProjectStore`) | loads and caches projects, reading unsaved editor buffers |
| `diagnostics-publisher.ts` (`DiagnosticsPublisher`) | shows diagnostics in the Problems panel |
| `refresh-scheduler.ts` (`RefreshScheduler`) | refreshes a project shortly after its files change |
| `completion/`, `hover/` | `PropCompletion`, `SectionCompletion`, `PropHover` |
| `commands/` | one `Command` subclass per palette command (add one by subclassing and listing it in `extension.ts`) |

Extension tests (`src/test`) run in plain Node against an in-memory stand-in for the `vscode` module (`vscode-stub.ts`, wired in by `setup.ts`), so they need no VS Code install. Extend the stub when new code uses more of the API.

