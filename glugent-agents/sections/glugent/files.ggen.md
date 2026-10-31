---
description: Default file names and the config globs
---
## Files

| Thing | Default |
|---|---|
| Project config | `glugent.config.json` (found by walking up from cwd) |
| Sections | `**/*.ggen.md` |
| Targets | `**/*.{{target,agent,doc}}.ggen.json` |

These defaults are just globs: set `sections.include/exclude` and `targets.include/exclude` in the config to put files anywhere (`agents.include/exclude` is still read, as an older name for `targets`). The config is authoritative; no folder structure is assumed. Add `"$schema"` to any target JSON for editor validation regardless of its file name.

A **target** is anything built from sections: an agent, a document, or something else. `.target.ggen.json`, `.agent.ggen.json` and `.doc.ggen.json` files are exactly the same thing; choose the suffix that tells readers what the file builds.
