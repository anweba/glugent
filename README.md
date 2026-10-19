# Glugent

Glue Markdown **sections** into **agents**. Sections are ordinary Markdown with `{props}`; agents are small JSON files listing which sections to glue together.

Use the `glugent` command-line tool to build agents, and the VS Code extension for highlighting, diagnostics and completion while you write sections.

## Files

| Thing | Default |
|---|---|
| Project config | `glugent.config.json` (found by walking up from cwd) |
| Sections | `**/*.ggen.md` |
| Agents | `**/*.agent.ggen.json` |

Both defaults are just globs: set `sections.include/exclude` and `agents.include/exclude` in the config to put files anywhere. The config is authoritative; no folder structure is assumed. Add `"$schema"` to any agent JSON for editor validation regardless of its file name.

## Template syntax

| Syntax | Meaning |
|---|---|
| `{NAME}` | required prop (build fails if no value) |
| `{NAME?}` | optional prop. If it renders to nothing and is alone on its line → the whole line is removed; inline → empty string |
| `{-NAME?-}` | optional prop with whitespace trimming. The `?` is required; a `-` marks the side(s) to trim, and only applies when the prop renders to nothing: `{-NAME?}` trims the left, `{NAME?-}` the right, `{-NAME?-}` both. Inline, only spaces and tabs are removed (never newlines). Alone on its line, the line is removed along with all whitespace, newlines included, on the marked side(s). Not allowed together with a default |
| `{- if A { ... } -}` | the same markers on an `if` block (`{-` before `if` trims left, `-}` closes and trims right); they apply when the block renders nothing. The closing `-}` still needs whitespace before it (`} -}`) |
| `{NAME?"text"}` | optional prop with an inline default. Used only when no other layer provides a value. The default may contain `{`/`}` and real line breaks; `\"`, `\\` and `\n` are also escapes |
| `{ if A && (B \|\| C) { ... } else if D { ... } else { ... } }` | conditional block: the first branch whose condition holds is rendered. A prop holds when it has a non-empty value (not `false`); operators, tightest first: `!` (not), `&&` (and) / `!&` (nand), `\|\|` (or) / `!\|` (nor); same-level operators group left to right, `()` groups. Bodies are text and/or any other `{...}`, including nested `if`s. Inline, a body is emitted verbatim (`{ if A {x} else {y} }`); if every tag (`{ if ... {`, `} else ... {`, `} }`) sits alone on its line, only the lines inside the chosen branch are emitted |
| `{{` / `}}` | literal `{` / `}` |
| `{!...!}` | raw block: everything inside is kept as-is; only the `{!` and `!}` are removed |

**Every `{` and `}` belongs to Glugent.** A single `{` or `}` that is not part of a tag is an error. To write one, use `{{` or `}}`, or wrap the text in a raw block. Pairs are read left to right, so `{{NAME}}` renders `{NAME}` and `{{{NAME}}}` renders the value of `NAME` in braces.

- Adjacent `}}` is always a literal `}`, so the closing `} }` of an `if` block needs whitespace between the braces (`{ if A {x} }`, not `{ if A {x}}`).
- Inside a raw block nothing is interpreted, including `{`, `}` and `{!`. The block ends at the first `!}`.
- To write `!}` itself, end the raw block, write `!}}` (a `!` and a literal `}`), and start a new raw block: `{!a!}!}}{!b!}` renders `a!}b`.
- Raw blocks work anywhere, including inside `if` bodies.

Loops, expressions and recursive interpolation are not supported. Required props inside an `if` body are only checked when the block is rendered.

A section may start with YAML frontmatter:

```md
---
description: Who the agent is
defaults:
  ROLE: Software Engineer
---
```

## Section ids

The id is the path relative to the config (or `sections.root`) without `.ggen.md`, e.g. `glugent/base/identity`. An agent may refer to a section by a unique path suffix (`base/identity`, or just `identity`).

## Prop precedence (lowest → highest)

1. inline default (`{NAME?"text"}`)
2. section `defaults`
3. agent `props`
4. section-entry `props` (`{ "use": "...", "props": {...} }`)
5. `props` in `glugent.config.json`
6. CLI `--set KEY=VALUE`

## CLI

```bash
glugent build [agent...] [--set KEY=VALUE]... [--config <path>] [--dry-run]
glugent validate [--set KEY=VALUE]... [--config <path>]
glugent list [--config <path>]
glugent convert <file.md>... [--force] [--dry-run]
```

`convert` turns plain Markdown into a section: it writes `<file>.ggen.md` next to each file, with every `{` escaped as `{{` and every `}` as `}}` (frontmatter is left alone). It needs no project and refuses to overwrite an existing file unless `--force` is given.

With no agent names, `build` builds every agent. The config is found by searching upward from the current directory. Example:

```bash
glugent build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```

## VS Code extension

Features: syntax highlighting for placeholders and `if` blocks, live diagnostics (unknown section, missing required prop, stray `{` or `}`, bad JSON), completion for prop names and section ids, hover, JSON-schema validation of config and agent files, and the commands *Glugent: Build All Agents / Build Agent… / Validate Project*.

`.ggen.md` files use the `glugent` language, which is Markdown plus Glugent tokens.
