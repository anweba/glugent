---
"@anweba/glugent-core": minor
"glugent-vscode": minor
---

Sections can include other sections. `{ REF section/id }` renders another section in place, as if the target listed it there: it uses its own prop layers (its `defaults`, then target, config and CLI props), not the including section's. `{ REF-OVERRIDE section/id }` does the same but lays the including section's props on top, so they win wherever both set a prop.

- The id is resolved like a target entry: the full id or a unique suffix.
- A `REF` alone on its line that renders nothing removes the line, like an empty optional prop.
- A `REF` to an unknown section and a section that includes itself (`a` → `b` → `a`) are errors reported at the `REF`. A missing required prop in an included section names the chain (`section 'b' (via 'a')`).
- `{REF}`, `{SLOT}` and `{if}` are still ordinary props; `BEGIN` and `END` are reserved and cannot be used as section ids after `REF`.
- `renderTemplate` takes an optional fourth argument, a callback that renders each `REF`; without it a `REF` is left as written.
- The editor extension highlights `REF` and `REF-OVERRIDE`.
