---
description: What the VS Code extension offers
---
{ REF BEGIN common/h2 | HEAD="VS Code extension" }
Features: syntax highlighting for placeholders and `if` blocks, live diagnostics (unknown section, missing required prop, stray `{{` or `}}`, bad JSON), completion for prop names and section ids, hover, JSON-schema validation of config and target files, and the commands *Glugent: Build All Targets / Build Target… / Validate Project*.

`.ggen.md` files use the `glugent` language, which is Markdown plus Glugent tokens, and show the Glugent file icon unless your icon theme has its own icon for them.

In an untrusted workspace (Restricted Mode) everything works except the build commands, which write files: they are hidden until you trust the workspace.
{ REF END common/h2 }
