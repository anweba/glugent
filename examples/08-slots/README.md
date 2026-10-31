# 08 · Slots

A **slot** is a gap in a section that whoever includes it fills. `blocks/step` is a reusable step with three slots; `release` uses it three times.

## Defining slots

In `blocks/step.ggen.md`:

| Slot | Meaning |
|---|---|
| `{ # }` | the `default` slot, **required** |
| `{ #check? }` | a slot named `check`, optional (`?`) |
| `{ #notes? -}` | optional, and when empty it also removes the blank line after it (trim markers, as in example 04) |

A slot must be alone on its line, and each name can be used once per section.

## Filling them

`release.ggen.md` includes the step three times:

1. **Just content.** Everything between `{ REF BEGIN blocks/step }` and `{ REF END blocks/step }` fills the `default` slot.
2. **Named slots.** With `{ SLOT BEGIN name }` … `{ SLOT END name }` blocks (no name means `default`), the REF block holds only those blocks. `notes` is filled here, so its paragraph appears.
3. **Through another section.** `blocks/risky-step` fills step's `default` slot with a warning **and its own `{ # }`**, so what `release` gives `risky-step` ends up inside step.

Slot content can use everything: props, conditions, REFs, other slots.

## Whose props does slot content see?

Slot content is written by the including section, so it renders with **its** props. `SLOT-INHERIT` turns that around: the filled section's props first, the including section's for the rest. Both sections set `SOURCE`:

| Slot | Tag | `{SOURCE}` |
|---|---|---|
| `default` | `SLOT BEGIN` | `the release workflow` |
| `check` | `SLOT-INHERIT BEGIN` | `the step block` |

## From the target

`targets/handoff.agent.ggen.json` uses the step directly and fills its slots in JSON:

```json
"slots": {
  "default": "Hand the release over to {OWNER}.",
  "check": "{ REF checks/handoff }"
}
```

The text renders with the entry's props (`OWNER`) and can include a section with `REF`.

## Try it

Add `{ REF blocks/step }` at the end of `release.ggen.md` and run `glugent validate`. A plain REF cannot fill the required slot:

```
sections/release.ggen.md:28:1 error: Required slot 'default' of section 'sections/blocks/step' is not filled
```
