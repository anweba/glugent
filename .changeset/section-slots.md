---
"@anweba/glugent-core": minor
"@anweba/glugent-schemas": minor
"glugent-vscode": minor
---

Sections can define **slots** that the including side fills.

- `{ # }` is a required slot and `{ #? }` an optional one; `{ #name }` / `{ #name? }` name it (unnamed is `default`). A slot must be alone on its line, names are unique in a section, and `{- #? -}` trims like `{-NAME?-}` when the slot is empty.
- `{ REF BEGIN id } ... { REF END id }` (or `REF-OVERRIDE`) includes a section and fills its slots. Its content fills `default`, or it holds only `{ SLOT BEGIN name } ... { SLOT END name }` blocks (no name: `default`). Content can use every feature, including the including section's own slots.
- Slot content renders with the including section's props. `{ SLOT-INHERIT BEGIN name }` content sees the filled section's props first and falls back to the including section's.
- Target entries can fill slots too: `{ "use": "card", "slots": { "default": "text, or { REF parts/body }" } }`. The text renders with the entry's props.
- Errors: a plain `{ REF id }` (or a target entry) that leaves a required slot empty, filling a slot the section does not define, filling one twice, and a REF block that mixes SLOT blocks with other content.
- `{SLOT}`, `{REF}`, `{BEGIN}` and `{END}` are still ordinary props.
- Library API: `Section.slots` lists a section's slots, `SectionRef.slots` holds an entry's fills, `scanTemplate` returns `slots`, and `renderTemplate` takes `slots` in its options and returns `missingSlots`.
- The target schema accepts `slots` on section entries; the editor extension highlights slots and `REF` / `SLOT` blocks.
