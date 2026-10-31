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
```

CI rebuilds the examples and fails if a committed `output/` differs, so after changing an example, or anything that changes what it renders, run `npm run examples:build` and commit the result.

To try the extension, open this repo in VS Code and run **Extension: try on examples/09-team** (F5). It builds everything and opens a second window on `examples/09-team` with the extension loaded: open a `.ggen.md` file for highlighting, hover and completion (type `{{`), break something to see diagnostics in the Problems panel, and use the *Glugent:* commands from the command palette.

### VS Code extension

```bash
cd packages/vscode && npm run package   # produces a glugent-vscode-<version>.vsix
```

Or press F5 in `packages/vscode` with an extension-development launch config. The placeholder grammar (`syntaxes/glugent-injection.tmLanguage.json`) is injected into the Markdown grammar so it works inside lists and code fences; keep it in sync with the syntax in `template.ts`.

