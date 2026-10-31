# 04 · Whitespace

When something is left out, the spaces and blank lines around it can stay behind. This example has the same section twice: `update-plain` without trim markers, `update` with them.

| Output | Section | Props |
|---|---|---|
| `output/empty-plain.md` | `update-plain` | only `WEEK` |
| `output/empty.md` | `update` | only `WEEK` |
| `output/filled.md` | `update` | everything |

## What Glugent does on its own

An optional prop or `if` block that renders nothing **and is alone on its line** removes that line. That is enough for lists (see example 03), but not for paragraphs: the blank lines around the removed line stay. `empty-plain.md` ends up with three empty lines in a row, and `" Week 42 "` keeps the spaces next to the missing props.

## Trim markers

A `-` next to the brace removes the whitespace on that side, **only when the prop or block renders nothing**:

| Marker | Removes | Here |
|---|---|---|
| `{-NAME?}` | whitespace to the left | `{-LABEL?}` |
| `{NAME?-}` | whitespace to the right | `{EMOJI?-}`, `{NOTE?-}` |
| `{-NAME?-}` | both sides | |
| `{- if … {` / `} -}` | the same, for an `if` block | `} -}` after `BLOCKERS` |

- **Inline**, only spaces and tabs are removed: `"{EMOJI?-} Week {WEEK} {-LABEL?}"` becomes `"Week 42"`.
- **Alone on a line**, the line goes, plus all whitespace on the marked side, newlines included. That is why the paragraphs use one side only: `{NOTE?-}` removes its line and the blank line after it. Both sides would join the paragraphs before and after into one line.
- The `?` is required: a required prop is never empty, so trimming would never happen.

With every prop set (`filled.md`), the markers change nothing.
