<!-- Generated from .glugent by `npm run docs:build`. Edit the sections in .glugent/sections, not this file. -->

<p align="center"><img src="https://raw.githubusercontent.com/anweba/glugent/main/packages/vscode/icons/glugent-128.png" alt="Glugent logo" width="96"></p>

# Glugent for VS Code

Editor support for [Glugent](https://github.com/anweba/glugent), which glues Markdown **sections** into **targets**: agents, docs, or anything else you build from Markdown. The extension starts in any workspace that contains a `glugent.config.json`.

## VS Code extension

Features: syntax highlighting for placeholders and `if` blocks, live diagnostics (unknown section, missing required prop, stray `{` or `}`, bad JSON), completion for prop names and section ids, hover, JSON-schema validation of config and target files, and the commands *Glugent: Build All Targets / Build Target… / Validate Project*.

`.ggen.md` files use the `glugent` language, which is Markdown plus Glugent tokens, and show the Glugent file icon unless your icon theme has its own icon for them.

## Troubleshooting

Other extensions that claim every `*.md` file can win over Glugent. If the status bar does not say "Glugent" for a `.ggen.md` file, add `"files.associations": { "*.ggen.md": "glugent" }` to the settings.

## More

- [Glugent on GitHub](https://github.com/anweba/glugent): the full documentation, including the template syntax
- [Examples](https://github.com/anweba/glugent/tree/main/examples), from a first agent to a team setup
- [Changelog](https://github.com/anweba/glugent/blob/main/packages/vscode/CHANGELOG.md) and [issues](https://github.com/anweba/glugent/issues)
- The packages: [`glugent`](https://www.npmjs.com/package/glugent) (the CLI), [`@anweba/glugent-core`](https://www.npmjs.com/package/@anweba/glugent-core) (the library) and [`@anweba/glugent-schemas`](https://www.npmjs.com/package/@anweba/glugent-schemas) (JSON Schemas)

## License

[MIT](https://github.com/anweba/glugent/blob/main/packages/vscode/LICENSE) © Antonín Báleš
