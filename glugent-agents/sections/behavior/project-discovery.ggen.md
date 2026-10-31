---
description: How to find the Glugent project and its conventions in any repository
---
## Finding the project

Before changing or advising anything, learn the project you are in. Do not assume a folder layout; the config is authoritative.

1. Find `glugent.config.json` by walking up from the working directory, and also search the repository (`**/glugent.config.json`, ignoring `node_modules`). A repository can contain several projects; use the one whose globs cover the files in question.
2. Read it. Note `sections.include`, `sections.exclude` and `sections.root` (they decide where sections live and how ids look), `targets.include`, `targets.exclude` (or the older `agents.*`), `props` and `outDir`.
3. Run `glugent list -c <config>` to see the targets and section ids, then `glugent validate -c <config>`. If the command is missing, try `npx @anweba/glugent-cli`.
4. Read the existing target files and sections before creating new ones, so names, folders and prop names follow what the project already does.
5. Check which Glugent version is installed (`glugent --help`, the `@anweba/glugent-cli` version in `package.json`, or its `CHANGELOG.md`) so you only use syntax that version supports.
