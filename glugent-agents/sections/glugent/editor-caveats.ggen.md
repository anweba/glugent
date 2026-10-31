---
description: Known caveats of the VS Code extension
---
## Extension caveats

- Diagnostics are produced per project and cover sections that some target uses.
- Other extensions that claim every `*.md` file (for example Nuxt MDC, "Markdown Components") can win over Glugent. If the status bar does not say "Glugent" for a `.ggen.md` file, add `"files.associations": {{ "*.ggen.md": "glugent" }}` to the settings.
- The extension only runs in the window it is installed in. In this repository it is tried with the "Extension: try on examples/09-team" launch configuration (F5), which opens a separate Extension Development Host window.
- The extension is distributed as a `.vsix`. Other editors have no Glugent plugin; JetBrains IDEs can load the TextMate grammar for highlighting only.
