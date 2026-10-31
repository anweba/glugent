---
description: Build, test and try the project and the extension locally
---
```bash
npm install && npm run build
npm test                      # builds, then tests core, the CLI and the extension
cd examples/basic
node ../../packages/cli/bin/glugent.js validate
node ../../packages/cli/bin/glugent.js build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```

### Trying it on the example project

```bash
npm run example:validate     # the CLI against examples/basic
npm run example:build        # writes examples/basic/dist/agents/*.md
```

To try the extension, open this repo in VS Code and run **Extension: try on examples/basic** (F5). It builds everything and opens a second window on `examples/basic` with the extension loaded: open a `.ggen.md` file for highlighting, hover and completion (type `{{`), break something to see diagnostics in the Problems panel, and use the *Glugent:* commands from the command palette.

### VS Code extension

```bash
cd packages/vscode && npm run package   # produces a glugent-vscode-<version>.vsix
```

Or press F5 in `packages/vscode` with an extension-development launch config. The placeholder grammar (`syntaxes/glugent-injection.tmLanguage.json`) is injected into the Markdown grammar so it works inside lists and code fences; keep it in sync with the syntax in `template.ts`.

