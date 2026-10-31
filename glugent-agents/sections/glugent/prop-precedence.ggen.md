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

