---
description: Every key of the config and of a target file
---
## Config keys

All keys are optional. Globs are relative to the config file.

| Key | Meaning |
|---|---|
| `sections.include` / `sections.exclude` | globs for section files (default `**/*.ggen.md`) |
| `sections.root` | directory that section ids are computed relative to (default: the config's directory) |
| `targets.include` / `targets.exclude` | globs for target files (default `**/*.{{target,agent,doc}}.ggen.json`); `agents.include` / `agents.exclude` is the older name and is merged in |
| `props` | project-wide props (strings, numbers or booleans) |
| `outDir` | default output folder for built targets (default `dist/agents`) |

`node_modules` and `.git` are always ignored. Unknown keys are errors. Add `$schema` only when the editor extension is not installed or the file has another name; the extension validates `glugent.config.json` and every `*.target.ggen.json`, `*.agent.ggen.json` and `*.doc.ggen.json` automatically.

## Target files

```json
{{
  "name": "my-target",
  "output": "optional/path/relative/to/the/config.md",
  "props": {{ "ROLE": "Reviewer" }},
  "sections": [
    "identity",
    {{ "use": "checklist", "props": {{ "STRICT": true }} }}
  ]
}}
```

`name` and `sections` are required. Each entry in `sections` is a section id or an object with `use`, its own `props`, and `slots`: slot contents by slot name (`default` for `{{ # }}`), as template text rendered with that entry's props, which may use `{{ REF id }}` (`{{ "use": "card", "slots": {{ "default": "{{ REF parts/body }}" }} }}`).
