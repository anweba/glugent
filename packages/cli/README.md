<!-- Generated from .glugent by `npm run docs:build`. Edit the sections in .glugent/sections, not this file. -->

<p align="center"><img src="https://raw.githubusercontent.com/anweba/glugent/main/packages/vscode/icons/glugent-128.png" alt="Glugent logo" width="96"></p>

# glugent

The command-line tool of [Glugent](https://github.com/anweba/glugent). It glues Markdown **sections** into **targets**: agents, docs, or anything else you build from Markdown.

## Install

```bash
npm i -D glugent      # in your project
npx glugent --help    # or run it without installing
```

## Quick start

Three files make a project:

```
glugent.config.json      { "props": { "PROJECT": "Acme Shop" } }
hello.ggen.md            # Hello
                         You are a helpful assistant working on {PROJECT}.
hello.agent.ggen.json    { "name": "hello", "sections": ["hello"] }
```

`npx glugent build` writes `dist/agents/hello.md`, with `{PROJECT}` replaced by `Acme Shop`.

## CLI

```bash
glugent build [target...] [--set KEY=VALUE]... [--config <path>] [--dry-run | --check]
glugent validate [--set KEY=VALUE]... [--config <path>]
glugent list [--config <path>]
glugent convert <file.md>... [--force] [--dry-run]
```

`convert` turns plain Markdown into a section: it writes `<file>.ggen.md` next to each file, with every `{` escaped as `{{` and every `}` as `}}` (frontmatter is left alone). It needs no project and refuses to overwrite an existing file unless `--force` is given.

With no target names, `build` builds every target. The config is found by searching upward from the current directory.

`build --check` writes nothing: it compiles the targets and compares each result with the file on disk, then exits with 1 if any file is missing or out of date, listing them. Use it to check committed or generated output, locally or in CI; it takes the same target names and `--set` as `build`. Example:

```bash
glugent build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```

## More

- [Glugent on GitHub](https://github.com/anweba/glugent): the full documentation, including the template syntax
- [Examples](https://github.com/anweba/glugent/tree/main/examples), from a first agent to a team setup
- [Changelog](https://github.com/anweba/glugent/blob/main/packages/cli/CHANGELOG.md) and [issues](https://github.com/anweba/glugent/issues)
- The packages: [`glugent`](https://www.npmjs.com/package/glugent) (the CLI), [`@anweba/glugent-core`](https://www.npmjs.com/package/@anweba/glugent-core) (the library) and [`@anweba/glugent-schemas`](https://www.npmjs.com/package/@anweba/glugent-schemas) (JSON Schemas)

## License

[MIT](https://github.com/anweba/glugent/blob/main/packages/cli/LICENSE) © Antonín Báleš
