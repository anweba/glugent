# 01 · Hello agent

The smallest Glugent project. Three files:

| File | What it is |
|---|---|
| `glugent.config.json` | Marks the project root. Sets the prop `PROJECT` and writes output to `output/` |
| `hello.ggen.md` | A **section**: Markdown with placeholders. `{PROJECT}` is a required prop |
| `hello.agent.ggen.json` | A **target**: its `name` and the `sections` it glues together |

Build it:

```bash
glugent build
```

`output/hello.md` is the section with `{PROJECT}` replaced by `Acme Shop`.

## Try it

- Change `PROJECT` in `glugent.config.json` and build again.
- Delete the `props` line and run `glugent validate`. A required prop with no value is an error, and nothing is written:

  ```
  hello.agent.ggen.json:2:11 error: Target 'hello': required prop 'PROJECT' of section 'hello' has no value
  1 error(s)
  ```
