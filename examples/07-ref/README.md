# 07 · REF

A section can include another section with `{ REF id }`. Each agent here lists **one** section, its role, and the role pulls in the shared safety rules. The id works like in a target: a full id or a unique ending (`shared/safety`).

```
roles/backend  ──REF──────────▶  shared/safety  ──REF──▶  shared/commands
roles/frontend ──REF-OVERRIDE─▶  shared/safety  ──REF──▶  shared/commands
```

## Whose props?

| Tag | The included section renders with |
|---|---|
| `{ REF id }` | **its own** props: its `defaults`, then target, config and `--set` props, as if the target had listed it |
| `{ REF-OVERRIDE id }` | the same, with **the including section's props on top** |

Both roles set `CONTACT` in their `defaults`, and `safety` has its own default:

| Output | Tag | `CONTACT` |
|---|---|---|
| `output/backend.md` | `REF` | `the team lead`: backend's default does not reach `safety` |
| `output/frontend.md` | `REF-OVERRIDE` | `the design lead`: frontend's default wins |

Target, config and `--set` props reach every section, included or not: the `backend` target sets `PACKAGE_MANAGER` to `pnpm`, and `commands`, two levels down, uses it. `frontend` sets nothing, so `commands` keeps its own `npm`.

`REF-OVERRIDE` only affects the section it names. `safety` includes `commands` with a plain `REF`, so the frontend's props stop there.

## Try it

Add `{ REF shared/safety }` to the end of `commands.ggen.md` and run `glugent validate`. A section that ends up including itself is an error, reported at the `REF`:

```
sections/shared/commands.ggen.md:7:1 error: Section 'sections/shared/safety' includes itself: 'sections/shared/safety' → 'sections/shared/commands' → 'sections/shared/safety'
```
