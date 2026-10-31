# 09 · Team

Everything together: three agents and a README for the people who work with them, all from the same parts. Copy this layout to start a real project.

```
glugent.config.json        values every target shares
targets/                   one tiny file per agent or doc
sections/
  agents/                  one root section per agent: everything it says
    reviewer, frontend, backend
  docs/readme              the root section of the README
  parts/                   pieces the roots put together
    identity, rules, checklist
  common/                  building blocks with no text of their own
    h1, h2
output/
```

## Clean targets

A target holds as little as possible: a name and **one** root section. All of an agent's text, including its own values, lives in that section.

```json
{
  "name": "reviewer",
  "sections": ["agents/reviewer"]
}
```

Where things go:

| What | Where | Here |
|---|---|---|
| values every agent shares | `props` in `glugent.config.json` | `PROJECT`, `REPO` |
| values one agent needs | the `defaults` of its root section | `TITLE`, `ROLE`, `FOCUS`, `CAN_MERGE` |
| text one agent needs | its root section | "How you review", "Stack" |
| text several agents share | a part, included by the root | `parts/rules` |
| how a heading looks | `common/h1` and `common/h2`, given `HEAD` by whoever uses them | every heading |

## How a root section is put together

`sections/agents/reviewer.ggen.md` uses each way of including a part:

| Line | Why |
|---|---|
| `{ REF-OVERRIDE parts/identity }` | `identity` needs the agent's own values, so the root's `defaults` must reach it |
| `{ REF parts/rules }` | `rules` only uses shared values, so a plain `REF` is enough, and the agent's props cannot change it by accident |
| `{ REF BEGIN common/h2 \| HEAD="How you review" }` … `{ REF END common/h2 }` | a heading with the agent's own text under it: `HEAD` is passed, the text fills h2's slot |
| `{ REF BEGIN parts/checklist }` … `{ REF END parts/checklist }` | the shared checklist has a slot; each agent adds its own items to the shared ones |

`identity` also has a condition: `CAN_MERGE` is only set for the reviewer, so only the reviewer may merge.

## Passing props to a REF

`common/h2` has one required prop, `HEAD`, and an optional slot for what goes under the heading. One section can use it several times with a different heading each time, because each `REF` passes its own value:

```
{ REF BEGIN common/h2 | HEAD="Rules" }          ← parts/rules
{ REF BEGIN common/h2 | HEAD="How you review" } ← agents/reviewer
{ REF BEGIN common/h1 | HEAD="{TITLE}" }        ← parts/identity
```

A quoted value is rendered with the props of the section that writes it: in `identity`, `"{TITLE}"` becomes the agent's title, which reached `identity` through `REF-OVERRIDE`. Passed props beat the included section's own props and `REF-OVERRIDE`'s; config and `--set` props still win.

## Adding an agent

1. Write `sections/agents/<name>.ggen.md`: its `defaults`, the parts it uses, its own text.
2. Add `targets/<name>.agent.ggen.json` with its name and that one section.

Nothing else changes, and a fix in a part reaches every agent at the next build.
