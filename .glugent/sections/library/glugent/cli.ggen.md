---
description: The glugent command line
---
{ REF BEGIN common/h2 | HEAD="CLI" }
```bash
glugent build [target...] [--set KEY=VALUE]... [--config <path>] [--dry-run | --check]
glugent validate [--set KEY=VALUE]... [--config <path>]
glugent list [--config <path>]
glugent convert <file.md>... [--force] [--dry-run]
```

`convert` turns plain Markdown into a section: it writes `<file>.ggen.md` next to each file, with every `{{` escaped as `{{{{` and every `}}` as `}}}}` (frontmatter is left alone). It needs no project and refuses to overwrite an existing file unless `--force` is given.

With no target names, `build` builds every target. The config is found by searching upward from the current directory.

`build --check` writes nothing: it compiles the targets and compares each result with the file on disk, then exits with 1 if any file is missing or out of date, listing them. Use it to check committed or generated output, locally or in CI; it takes the same target names and `--set` as `build`. Example:

```bash
glugent build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```
{ REF END common/h2 }
