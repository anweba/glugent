---
description: README of the glugent-vscode extension, shown on the VS Code Marketplace and Open VSX
---
{ REF repo/generated-note }

{ REF parts/logo }

{ REF BEGIN common/h1 | HEAD="Glugent for VS Code" }
Editor support for [{PROJECT}]({REPO_URL}), which glues Markdown **sections** into **targets**: agents, docs, or anything else you build from Markdown. The extension starts in any workspace that contains a `glugent.config.json`.
{ REF END common/h1 }

{ REF glugent/editor-extension }

{ REF BEGIN common/h2 | HEAD="Troubleshooting" }
Other extensions that claim every `*.md` file can win over Glugent. If the status bar does not say "Glugent" for a `.ggen.md` file, add `"files.associations": {{ "*.ggen.md": "glugent" }}` to the settings.
{ REF END common/h2 }

{ REF parts/package-links | DIR="packages/vscode" }
