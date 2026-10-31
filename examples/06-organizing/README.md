# 06 · Organizing

A project with folders, several targets of different kinds, and a config that says where everything is.

```
glugent.config.json
library/              ← sections (sections.root)
  base/identity, base/rules
  roles/reviewer, roles/writer
  docs/handbook-intro
  drafts/             ← excluded
targets/              ← targets (targets.include)
output/
```

## The config

| Key | Here | Meaning |
|---|---|---|
| `sections.include` / `exclude` | `library/**/*.ggen.md`, minus `library/drafts/**` | which files are sections (default: every `*.ggen.md`) |
| `sections.root` | `library` | section ids are paths from here, so `library/base/rules.ggen.md` is `base/rules` |
| `targets.include` | `targets/*.ggen.json` | which files are targets |
| `props` | `PROJECT` | props for every target |
| `outDir` | `output` | where a target goes without its own `output` (as `<name>.md`) |
| `$schema` | | editor completion and checks; the Glugent extension does this without it |

`library/drafts/ideas.ggen.md` has a stray `{`, which would be an error, but it is excluded, so it is never read.

## Section ids

A target names a section by its id, or by a **unique ending** of it:

- `reviewer` writes `identity` and `rules` (short); `writer` writes `base/identity` and `base/rules` (full). Both get the same sections.
- An ending that matches two sections is an error. Add `library/roles/rules.ggen.md` and `rules` stops working:

  ```
  targets/reviewer.agent.ggen.json:5:28 error: Section 'rules' is ambiguous: base/rules, roles/rules
  ```

## Kinds of targets

`*.agent.ggen.json`, `*.doc.ggen.json` and `*.target.ggen.json` are the same thing; pick the suffix that says what the file builds.

| Target | Kind | Output |
|---|---|---|
| `reviewer`, `writer` | agent | `output/reviewer.md`, `output/writer.md` (`outDir`) |
| `handbook` | doc | `output/HANDBOOK.md` (its own `output`) |
| `roles` | target | `output/roles.md` |

## Try it

```bash
glugent list                     # every target and section id
glugent build reviewer           # one target
glugent build --dry-run          # check everything, write nothing
```
