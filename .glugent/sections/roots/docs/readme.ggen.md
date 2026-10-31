---
description: README.md of the repository
---
{ REF repo/generated-note }

{ REF BEGIN common/h1 | HEAD="Glugent" }
[![CI]({REPO_URL}/actions/workflows/ci.yml/badge.svg)]({REPO_URL}/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/glugent)](https://www.npmjs.com/package/glugent)
[![downloads](https://img.shields.io/npm/dm/glugent)](https://www.npmjs.com/package/glugent)
[![license](https://img.shields.io/github/license/anweba/glugent)](LICENSE)

Glue Markdown **sections** into **targets**: agents, docs, or anything else you build from Markdown. Sections are ordinary Markdown with `{{props}}`; targets are small JSON files listing which sections to glue together.

Use the `glugent` command-line tool to build targets, and the VS Code extension for highlighting, diagnostics and completion while you write sections.
{ REF END common/h1 }

{ REF glugent/files }

{ REF glugent/template-syntax }

{ REF glugent/section-ids }

{ REF glugent/prop-precedence }

{ REF glugent/cli }

{ REF glugent/editor-extension }

{ REF BEGIN common/h2 | HEAD="License" }
[MIT](LICENSE) © {AUTHOR}
{ REF END common/h2 }
