---
description: The template language used inside sections
---
## Template syntax

| Syntax | Meaning |
|---|---|
| `{{NAME}}` | required prop (build fails if no value) |
| `{{NAME?}}` | optional prop. If it renders to nothing and is alone on its line → the whole line is removed; inline → empty string |
| `{{-NAME?-}}` | optional prop with whitespace trimming. The `?` is required; a `-` marks the side(s) to trim, and only applies when the prop renders to nothing: `{{-NAME?}}` trims the left, `{{NAME?-}}` the right, `{{-NAME?-}}` both. Inline, only spaces and tabs are removed (never newlines). Alone on its line, the line is removed along with all whitespace, newlines included, on the marked side(s). Not allowed together with a default |
| `{{- if A {{ ... }} -}}` | the same markers on an `if` block (`{{-` before `if` trims left, `-}}` closes and trims right); they apply when the block renders nothing. The closing `-}}` still needs whitespace before it (`}} -}}`) |
| `{{NAME?"text"}}` | optional prop with an inline default. Used only when no other layer provides a value. The default may contain `{{`/`}}` and real line breaks; `\"`, `\\` and `\n` are also escapes |
| `{{ if A && (B \|\| C) {{ ... }} else if D {{ ... }} else {{ ... }} }}` | conditional block: the first branch whose condition holds is rendered. A prop holds when it has a non-empty value (not `false`); operators, tightest first: `!` (not), `&&` (and) / `!&` (nand), `\|\|` (or) / `!\|` (nor); same-level operators group left to right, `()` groups. Bodies are text and/or any other `{{...}}`, including nested `if`s. Inline, a body is emitted verbatim (`{{ if A {{x}} else {{y}} }}`); if every tag (`{{ if ... {{`, `}} else ... {{`, `}} }}`) sits alone on its line, only the lines inside the chosen branch are emitted |
| `{{ REF section/id }}` | the content of another section, rendered as if the target listed it here: with its own prop layers (its `defaults`, then target, config and CLI props), not the including section's. The id is resolved like a target entry (full id or unique suffix). Alone on its line and empty → the line is removed |
| `{{ REF-OVERRIDE section/id }}` | the same, but the including section's props are laid on top, so they win wherever both set a prop |
| `{{ REF section/id \| NAME="text" FLAG=true }}` | passes props to the included section, on any `REF`, `REF-OVERRIDE` or `REF BEGIN`. A quoted value is a template rendered with the including section's props (`HEAD="{{TITLE}} rules"`; `\"`, `\\` and `\n` escape); `true`, `false` and numbers are written bare. They beat the included section's own props and `REF-OVERRIDE`'s, but not config or CLI props. Names are separated by spaces and can be passed once |
| `{{ # }}` / `{{ #? }}` | a slot: the including side fills it (`?`: filling it is optional). Name it with `{{ #name }}` / `{{ #name? }}`; unnamed is `default`. It must be alone on its line, names are unique in a section, and `{{- #? -}}` trims like `{{-NAME?-}}` when the slot is empty |
| `{{ REF BEGIN section/id }}` … `{{ REF END section/id }}` | a `REF` (or `REF-OVERRIDE`) that fills the section's slots. The content fills `default`, or holds only `{{ SLOT BEGIN name }}` … `{{ SLOT END name }}` blocks (no name: `default`). Content can use every feature, including the including section's own slots. A plain `{{ REF id }}` to a section with a required slot is an error |
| `{{ SLOT-INHERIT BEGIN name }}` … `{{ SLOT END name }}` | a slot fill that sees the filled section's props first and falls back to the including section's |
| `{{{{` / `}}}}` | literal `{{` / `}}` |
| `{{!...!}}` | raw block: everything inside is kept as-is; only the `{{!` and `!}}` are removed |

Prop names start with an ASCII letter or `_`, followed by letters, digits, `_` or `.`. Hyphens are not allowed (write `TEST_RUNNER`, not `TEST-RUNNER`), and names are case-sensitive. Keywords are only keywords in their own shape, so `{{if}}`, `{{REF}}` and `{{SLOT}}` are ordinary props; `BEGIN` and `END` cannot be section ids after `REF`.

A section that includes itself through `REF`s (`a` → `b` → `a`) and a `REF` to an unknown section are errors, reported at the `REF`. A missing required prop in a `REF`'d section names the chain that led to it (`section 'b' (via 'a')`). Filling a slot the section does not define, filling one twice, and leaving a required slot empty are errors too.

Slot content is written by the including section, so it renders with that section's props, not the filled section's (`SLOT-INHERIT` reverses that). Example:

```md
{{ REF BEGIN card }}
{{ SLOT BEGIN }}
Body, rendered with this section's props: {{ROLE}}
{{ SLOT END }}
{{ SLOT-INHERIT BEGIN footer }}
Footer, rendered with card's props first: {{ROLE}}
{{ SLOT END footer }}
{{ REF END card }}
```

**Every `{{` and `}}` belongs to Glugent.** A single `{{` or `}}` that is not part of a tag is an error. To write one, use `{{{{` or `}}}}`, or wrap the text in a raw block. Pairs are read left to right, so `{{{{NAME}}}}` renders `{{NAME}}` and `{{{{{{NAME}}}}}}` renders the value of `NAME` in braces.

- Adjacent `}}}}` is always a literal `}}`, so the closing `}} }}` of an `if` block needs whitespace between the braces (`{{ if A {{x}} }}`, not `{{ if A {{x}}}}`).
- Inside a raw block nothing is interpreted, including `{{`, `}}` and `{{!`. The block ends at the first `!}}`.
- To write `!}}` itself, end the raw block, write `!}}}}` (a `!` and a literal `}}`), and start a new raw block: `{{!a!}}!}}}}{{!b!}}` renders `a!}}b`.
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

