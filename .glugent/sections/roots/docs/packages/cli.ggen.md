---
description: README of the glugent package (the CLI) on npm
---
{ REF repo/generated-note }

{ REF parts/logo }

{ REF BEGIN common/h1 | HEAD="glugent" }
The command-line tool of [{PROJECT}]({REPO_URL}). It glues Markdown **sections** into **targets**: agents, docs, or anything else you build from Markdown.
{ REF END common/h1 }

{ REF BEGIN common/h2 | HEAD="Install" }
```bash
npm i -D glugent      # in your project
npx glugent --help    # or run it without installing
```
{ REF END common/h2 }

{ REF BEGIN common/h2 | HEAD="Quick start" }
Three files make a project:

{!```
glugent.config.json      { "props": { "PROJECT": "Acme Shop" } }
hello.ggen.md            # Hello
                         You are a helpful assistant working on {PROJECT}.
hello.agent.ggen.json    { "name": "hello", "sections": ["hello"] }
```!}

`npx glugent build` writes `dist/agents/hello.md`, with `{{PROJECT}}` replaced by `Acme Shop`.
{ REF END common/h2 }

{ REF glugent/cli }

{ REF parts/package-links | DIR="packages/cli" }
