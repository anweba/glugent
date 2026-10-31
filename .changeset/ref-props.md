---
"@anweba/glugent-core": minor
"glugent-vscode": minor
---

A `REF` can pass props to the section it includes: `{ REF common/h2 | HEAD="How you review" LEVEL=2 }`. It works on `REF`, `REF-OVERRIDE` and `REF BEGIN` (not on END tags).

- A quoted value is a template rendered with the including section's props, so `HEAD="{TITLE} rules"` passes the includer's `TITLE`. A required prop missing there is the including section's error. Inside the quotes, `\"`, `\\` and `\n` escape, and literal braces are `{{` / `}}`.
- `true`, `false` and numbers are written bare (`STRICT=true`), so they work in conditions; the string `"false"` would count as set.
- Precedence for the included section: its own `defaults` → target props → the including section's props (`REF-OVERRIDE`) → **passed props** → config props → `--set`.
- Props are separated by spaces; passing one twice, or a value that is not quoted, `true`, `false` or a number, is an error.
- Library API: `TemplateRef.props` holds the passed props, already rendered.
- The editor extension highlights the passed props.
