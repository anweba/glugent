# 05 · Escaping

In a section, every `{` and `}` belongs to Glugent. A single brace that is not part of a placeholder is an error. There are two ways to write literal braces.

| Write | Get | Use for |
|---|---|---|
| `{{` / `}}` | `{` / `}` | a brace here and there |
| `{! … !}` | everything inside, exactly as written | code samples full of braces |

Look at `sections/reply-format.ggen.md` next to `output/reporter.md`:

- `from {{ to }}` and `{{}}` become `from { to }` and `{}`.
- `{PROJECT}` outside the raw block is replaced; inside it, `{PROJECT}` and `{name}` stay exactly as written.
- `{!` and `!}` sit on the fence lines: everything between them is kept, line breaks included, so `{!` on a line of its own would leave an empty line behind.

## Converting existing Markdown

`legacy/old-prompt.md` is plain Markdown, written before Glugent, with braces everywhere. `glugent convert` turns it into a section by doubling every brace:

```bash
glugent convert legacy/old-prompt.md --dry-run   # says what it would write
glugent convert legacy/old-prompt.md             # writes legacy/old-prompt.ggen.md
```

The new file renders back to the original text. It is a section like any other (id `legacy/old-prompt`), so a target can list it. `convert` never overwrites a file unless you pass `--force`.
