# 03 · Conditions

One section, `workflow`, built by two targets with different props. Compare `output/strict.md` and `output/quick.md`.

## When a condition holds

A prop holds when it has a non-empty value that is not `false`. In `quick`, `TICKET_URL` is `""` and `TESTS` is `false`, so neither holds.

## Two shapes

| Shape | Written as | Rendered |
|---|---|---|
| **inline** | `first{ if TICKET_URL {, at {TICKET_URL}} }.` | the chosen body, in place |
| **whole lines** | every tag (`{ if X {`, `} else {`, `} }`) alone on its line | only the lines of the chosen branch; the tag lines never appear |

## Branches and operators

- `{ if A { … } else if B { … } else { … } }`: the first branch whose condition holds is rendered (`TYPESCRIPT` → `JAVASCRIPT` → fallback).
- `!` not, `&&` and, `||` or, `!&` nand (not both), `!|` nor (neither). `!` binds tightest, then `&&` / `!&`, then `||` / `!|`; parentheses group.
- `if`s nest: the "Nothing runs the tests for you" line only appears when `TESTS` holds and `CI` does not.

| Condition | `strict` | `quick` |
|---|---|---|
| `TICKET_URL` | holds | `""`, does not hold |
| `TYPESCRIPT` / `JAVASCRIPT` | TypeScript | neither: fallback |
| `TESTS` | holds (and `CI`, so no warning) | `false` |
| `TESTS !& LINT` | both hold: no | not both: yes |
| `TESTS !\| LINT` | no | neither holds: yes |
| `(DOCS \|\| CHANGELOG) && !DRAFT` | yes | `DRAFT` holds: no |

## Try it

```bash
glugent build strict --set CI=false   # the nested warning appears
```
