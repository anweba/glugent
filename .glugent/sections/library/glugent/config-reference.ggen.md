---
description: Every key of the config and of a target file
---
{ REF BEGIN common/h2 | HEAD="Config keys" }
All keys are optional. Globs are relative to the config file.

| Key | Meaning |
|---|---|
| `sections.include` / `sections.exclude` | globs for section files (default `**/*.ggen.md`) |
| `sections.root` | directory that section ids are computed relative to (default: the config's directory) |
| `targets.include` / `targets.exclude` | globs for target files (default `**/*.{{target,agent,doc}}.ggen.json`); `agents.include` / `agents.exclude` is the older name and is merged in |
| `props` | project-wide props (strings, numbers or booleans) |
| `outDir` | default output folder for built targets (default `dist/agents`) |

Built files are only written inside the config's directory: an `outDir` or a target `output` that leads outside it (including through a symbolic link), into a `.git` folder, or to a symbolic link is an error, and nothing is written for that target.

Section and target files are only read inside the config's directory too: a glob match outside it, or a symbolic link that leads outside it or into `.git`, is an error and the file is not read. Symbolic links to folders are not followed.

`node_modules` and `.git` are always ignored. Unknown keys are errors. Add `$schema` only when the editor extension is not installed or the file has another name; the extension validates `glugent.config.json` and every `*.target.ggen.json`, `*.agent.ggen.json` and `*.doc.ggen.json` automatically.
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="Target files" }
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
{ REF END common/h2 }
