---
description: The glugent command line
---
## CLI

```bash
glugent build [target...] [--set KEY=VALUE]... [--config <path>] [--dry-run]
glugent validate [--set KEY=VALUE]... [--config <path>]
glugent list [--config <path>]
glugent convert <file.md>... [--force] [--dry-run]
```

`convert` turns plain Markdown into a section: it writes `<file>.ggen.md` next to each file, with every `{{` escaped as `{{{{` and every `}}` as `}}}}` (frontmatter is left alone). It needs no project and refuses to overwrite an existing file unless `--force` is given.

With no target names, `build` builds every target. The config is found by searching upward from the current directory. Example:

```bash
glugent build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```

