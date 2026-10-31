---
description: The repository's own Glugent project that builds its agents and its documents (README.md and CONTRIBUTING.md)
---
{ REF BEGIN common/h2 | HEAD="This repository's own Glugent project" }
The folder `.glugent/` is a Glugent project that the repository uses on itself. Its config is the root `glugent.config.json`.

- Target files live in `.glugent/targets/agents/` (`*.agent.ggen.json`) and `.glugent/targets/docs/` (`*.doc.ggen.json`); sections live in `.glugent/sections/`.
- It is laid out like `examples/09-team`. Each target names one root section and nothing else (plus `output` for a document). The root sections mirror the targets, in `sections/roots/agents/` and `sections/roots/docs/` with the same names, and each holds everything its target says: its own values in `defaults` (`ROLE`, `MISSION`), its own text, and the pieces it includes.
- The pieces live in `sections/library/`: `parts/` (`identity`, the bundles `glugent-reference` and `repo-handbook`, and `project-discovery`), the topics in `glugent/` (how Glugent works) and `repo/` (how this repository works), and `common/h1`, `h2` and `h3` for headings. They are included by the end of their id (`parts/identity`, `glugent/cli`), which stays unique. Every heading is written as `{{ REF BEGIN common/h2 | HEAD="Title" }}` … `{{ REF END common/h2 }}`, and agents include `parts/identity` with `REF-OVERRIDE` so their `ROLE` and `MISSION` reach it.
- The agents `glugent-agent-builder`, `glugent-developer` and `glugent-helper` are built from them, and so are the documents `README.md` and `CONTRIBUTING.md` (the `readme` and `contributing` targets). Those two files are generated: change the text in the sections, never in the files, then run `npm run docs:build` and commit the result.
- `npm run targets:build` builds everything; `npm run docs:build` builds only the two documents. Agents that are not documents are written to `/agents`, which is git-ignored.
- `npm run targets:validate` checks the project, and CI fails when the committed `README.md` or `CONTRIBUTING.md` differs from what the build produces.
{ REF END common/h2 }
