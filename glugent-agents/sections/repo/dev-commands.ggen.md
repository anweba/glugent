---
description: Build, test and try the project and the extension locally
---
```bash
npm install && npm run build
npm test                      # builds, then tests core, the CLI and the extension
cd examples/02-props
node ../../packages/cli/bin/glugent.js validate
node ../../packages/cli/bin/glugent.js build --set TONE=formal
```

### Trying it on the examples

`examples/` holds numbered example projects, from the smallest (`01-hello-agent`) to a full team setup (`09-team`); each has a `README.md` and its committed build in `output/`.

```bash
npm run examples:validate    # the CLI against every example
npm run examples:build       # rebuilds every examples/*/output
npm run examples:check       # writes nothing; fails if an output is stale, missing or left over
```

CI checks the examples and fails if a committed `output/` differs, so after changing an example, or anything that changes what it renders, run `npm run examples:build` and commit the result.

### Checks and Git hooks

`npm run verify` runs what CI runs: build, tests, `docs:check` and `examples:check`. `npm run targets:check` tells you whether the built agents in `agents/` match the sources.

`npm install` turns on the hooks in `.githooks/` (`git config core.hooksPath .githooks`):

| Hook | Does |
|---|---|
| `pre-push` | runs `npm run verify`, then checks for a changeset against `origin/main`, as CI does; a failure stops the push |
| `post-checkout`, `post-merge`, `post-rewrite` | after switching or creating a branch, a pull or merge, or a rebase: warns when `agents/` or the generated docs do not match the sources. It never rebuilds or blocks; rebuild with `npm run targets:build` |

The checks run on the working tree, not on exactly what is pushed, so CI stays the final word. Skip the pre-push hook once with `git push --no-verify`.

To try the extension, open this repo in VS Code and run **Extension: try on examples/09-team** (F5). It builds everything and opens a second window on `examples/09-team` with the extension loaded: open a `.ggen.md` file for highlighting, hover and completion (type `{{`), break something to see diagnostics in the Problems panel, and use the *Glugent:* commands from the command palette.

### VS Code extension

```bash
cd packages/vscode && npm run package   # produces a glugent-vscode-<version>.vsix
```

Or press F5 in `packages/vscode` with an extension-development launch config. The placeholder grammar (`syntaxes/glugent-injection.tmLanguage.json`) is injected into the Markdown grammar so it works inside lists and code fences; keep it in sync with the syntax in `template.ts`.

