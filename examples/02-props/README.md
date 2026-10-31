# 02 · Props

Props are the `{...}` placeholders. This example shows the three kinds, and where a prop's value can come from.

## The three kinds

| Placeholder | Meaning | Here |
|---|---|---|
| `{NAME}` | **required**: the build fails without a value | `{AGENT_NAME}`, `{PROJECT}` |
| `{NAME?}` | **optional**: renders nothing when unset; alone on its line, the line disappears | `{MOTTO?}` in `identity` (unset, so its line is gone) |
| `{NAME?"text"}` | optional with an **inline default**, which may span lines | `{FORMATTER?"Prettier"}`, `{STUCK?"…"}` |

A section can also start with YAML frontmatter: `description` says what it is for, and `defaults` gives its props a value (see `style.ggen.md`).

## Which value wins

A prop can be set in several places. Lowest to highest:

1. inline default `{NAME?"text"}`
2. the section's `defaults`
3. the target's `props`
4. the section entry's `props` (`{ "use": "style", "props": { ... } }`)
5. `props` in `glugent.config.json`
6. `glugent build --set NAME=value`

Each prop in `style` and `identity` is won by a different layer:

| Prop | Set in | Result |
|---|---|---|
| `FORMATTER` | 1 | `Prettier` |
| `LANGUAGE` | 2 | `English` |
| `TONE` | 2, 3 | `friendly` |
| `LENGTH` | 2, 3, 4 | `very short` |
| `PROJECT` | 3, 5 | `Acme Shop`: the config beats the target |

Compare with `output/writer.md`.

## Try it

```bash
glugent build --set TONE=formal          # layer 6 beats everything
glugent build --set MOTTO="Ship it."     # the MOTTO line appears
```

`--set` only changes this build; `output/` in the repository is built without it.
