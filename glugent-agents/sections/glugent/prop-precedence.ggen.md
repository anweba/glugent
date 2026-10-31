---
description: Which prop layer wins
---
## Prop precedence (lowest → highest)

1. inline default (`{{NAME?"text"}}`)
2. section `defaults`
3. target `props`
4. section-entry `props` (`{{ "use": "...", "props": {{...}} }}`)
5. `props` in `glugent.config.json`
6. CLI `--set KEY=VALUE`

Each section gets its own set of props; sections never see each other's `defaults`. A section included with `{{ REF id }}` has no section entry, so it gets layers 1–3, 5 and 6 only. `{{ REF-OVERRIDE id }}` then lays the including section's resolved props on top, which in effect puts the includer's `defaults` and section-entry `props` above the included section's `defaults`; config and CLI props still win.

Slot content renders with the props of the section that wrote it (the including one). `{{ SLOT-INHERIT BEGIN name }}` content renders with the filled section's props, falling back to the including section's for props it does not set. Slot text in a target entry's `slots` renders with that entry's props.

