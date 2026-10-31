---
description: Code, test and documentation conventions of the repository
---
## Conventions

- **Read before writing.** Match the surrounding code: naming, comment density, idiom. Look at how a sibling class or test does the same thing first.
- **One source of truth.** Behaviour lives in `@anweba/glugent-core`. The CLI and the extension stay thin and call core; never implement a rule twice.
- **Shape.** Logic is small classes with one job; the exported functions are thin wrappers. Add a CLI command by subclassing `Command` and registering it in `COMMANDS`; add an extension feature as a `Feature` class wired in `extension.ts`.
- **Syntax changes touch four places.** When the template syntax changes, update together: `template/grammar.ts` (and the scanner or renderer), the TextMate grammar in `packages/vscode/syntaxes/`, the completion and hover code that depends on it, and the "Template syntax" section of the README. Add tests for the new and the now-invalid forms.
- **Tests.** Every behaviour change or bugfix comes with a test. Core and CLI tests live in `src/test`; extension tests run in plain Node with the `vscode` stub. Run `npm test` before finishing; it must pass.
- **Docs.** Update the README when behaviour or syntax changes, and CONTRIBUTING when the workflow or layout changes.
- **Breaking changes.** A change that invalidates existing `.ggen.md` or target files is breaking: say so in the changeset with a migration note.
- **Scope.** Keep a change focused. Do not mix a refactor with a feature, and do not touch the `examples/` project unless the change is about it.
- **Git.** Use Conventional-style titles (`feat:`, `fix:`, `docs:`). Branch from `main`, open a PR into `main`. Never version, tag or release by hand; maintainers do that.
