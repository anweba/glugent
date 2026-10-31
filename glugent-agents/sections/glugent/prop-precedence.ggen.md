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

Each section gets its own set of props; sections never see each other's `defaults`. For a section included with a `REF`, layer 4 is what the REF passes (`{{ REF id | NAME="text" }}`), and `REF-OVERRIDE` adds the including section's resolved props just below it:

1. inline default
2. the included section's `defaults`
3. target `props`
4. the including section's props (`REF-OVERRIDE` only)
5. props passed with `| NAME="text"`
6. `props` in `glugent.config.json`
7. CLI `--set KEY=VALUE`

Slot content renders with the props of the section that wrote it (the including one). `{{ SLOT-INHERIT BEGIN name }}` content renders with the filled section's props, falling back to the including section's for props it does not set. Slot text in a target entry's `slots` renders with that entry's props.

