<!-- Generated from .glugent by `npm run docs:build`. Edit the sections in .glugent/sections, not this file. -->

<p align="center"><img src="https://raw.githubusercontent.com/anweba/glugent/main/packages/vscode/icons/glugent-128.png" alt="Glugent logo" width="96"></p>

# @anweba/glugent-schemas

JSON Schemas for the files of [Glugent](https://github.com/anweba/glugent), for completion and validation in your editor.

## Files

| Schema | For |
|---|---|
| `glugent-config.schema.json` | `glugent.config.json` |
| `target.schema.json` | target files: `*.target.ggen.json`, `*.agent.ggen.json`, `*.doc.ggen.json` |
| `agent.schema.json` | the older name of `target.schema.json` |

## Usage

The Glugent VS Code extension applies these schemas on its own. In other editors, point `$schema` at them, without installing anything:

```json
{
  "$schema": "https://unpkg.com/@anweba/glugent-schemas/target.schema.json",
  "name": "hello",
  "sections": ["hello"]
}
```

Or install the package (`npm i -D @anweba/glugent-schemas`) and use `"./node_modules/@anweba/glugent-schemas/target.schema.json"`.

## More

- [Glugent on GitHub](https://github.com/anweba/glugent): the full documentation, including the template syntax
- [Examples](https://github.com/anweba/glugent/tree/main/examples), from a first agent to a team setup
- [Changelog](https://github.com/anweba/glugent/blob/main/packages/schemas/CHANGELOG.md) and [issues](https://github.com/anweba/glugent/issues)
- The packages: [`glugent`](https://www.npmjs.com/package/glugent) (the CLI), [`@anweba/glugent-core`](https://www.npmjs.com/package/@anweba/glugent-core) (the library) and [`@anweba/glugent-schemas`](https://www.npmjs.com/package/@anweba/glugent-schemas) (JSON Schemas)

## License

[MIT](https://github.com/anweba/glugent/blob/main/packages/schemas/LICENSE) © Antonín Báleš
