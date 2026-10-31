---
description: The repository's own Glugent project that builds its agents and its documents (README.md and CONTRIBUTING.md)
---
## This repository's own Glugent project

The folder `glugent-agents/` is a Glugent project that the repository uses on itself. Its config is the root `glugent.config.json`.

- Sections live in `glugent-agents/sections/`, and target files in `glugent-agents/targets/` (`*.agent.ggen.json` for the agents, `*.doc.ggen.json` for the documents).
- The agents `glugent-agent-builder`, `glugent-developer` and `glugent-helper` are built from them, and so are the documents `README.md` and `CONTRIBUTING.md` (the `readme` and `contributing` targets). Those two files are generated: change the text in the sections, never in the files, then run `npm run docs:build` and commit the result.
- `npm run targets:build` builds everything; `npm run docs:build` builds only the two documents. Agents that are not documents are written to `/agents`, which is git-ignored.
- `npm run targets:validate` checks the project, and CI fails when the committed `README.md` or `CONTRIBUTING.md` differs from what the build produces.
