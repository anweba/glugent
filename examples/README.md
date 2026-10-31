# Examples

Each folder is a complete, small Glugent project. They build on each other, so read them in order. Every example has a `README.md` that says what to look at, and an `output/` folder with what it builds.

| Example | Shows |
|---|---|
| [01-hello-agent](01-hello-agent) | The smallest project: one section, one target, one prop |
| [02-props](02-props) | Required, optional and default props, and which value wins |
| [03-conditions](03-conditions) | `if` / `else if` / `else` and the condition operators |
| [04-whitespace](04-whitespace) | Keeping the output clean when things are left out |
| [05-escaping](05-escaping) | Writing literal braces, raw blocks, converting old Markdown |
| [06-organizing](06-organizing) | Folders, section ids, the config file, several targets |
| [07-ref](07-ref) | Sections that include other sections |
| [08-slots](08-slots) | Sections with gaps that the including side fills |
| [09-team](09-team) | Everything together: a clean setup for a team of agents, with props passed through REFs |

## Running them

In your own project, the command is `npx glugent`. In this repository, use the local build so the examples match the code:

```bash
npm run build                                  # once, from the repository root
cd examples/01-hello-agent
node ../../packages/cli/bin/glugent.js build   # what the READMEs call `glugent build`
```

`npm run examples:build` rebuilds every example from the repository root; CI fails if a committed `output/` folder does not match.
