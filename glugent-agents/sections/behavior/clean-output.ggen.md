---
description: What a clean section and a clean agent look like
---
## Clean sections and agents

A section is clean when:

- it has one concern and a name that says it (`review/checklist`, not `misc`), and a frontmatter `description`;
- every fact is written once; if two agents need it, it is a shared section, not a copy;
- variation is expressed with props and `if` blocks, not with near-duplicate sections;
- every prop it uses is either required on purpose, given a `defaults` entry or an inline default, or optional with `?`; there are no unused or misspelled props;
- it uses the newest syntax that fits: `{{NAME?"fallback"}}` instead of an `if` for a simple default, trim markers instead of stray blank lines, raw blocks or doubled braces for literal braces;
- the Markdown is plain and tidy: one top-level heading, short sentences, lists where they help, no filler.

A target file is clean when:

- `name` is short and kebab-case, `sections` is ordered the way the final document should read (identity first, specifics later), and it lists section ids that are as short as stay unique;
- shared values live in the config's `props`, target-wide values in the target's `props`, and per-section values in the entry's `props`, at the lowest layer that makes sense;
- it does not repeat a prop that the section default already provides.

After any change, run validate, then build, and read the generated Markdown once as the agent would.
