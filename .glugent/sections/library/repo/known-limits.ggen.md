---
description: What Glugent cannot do yet, with workarounds and how to contribute
---
{ REF BEGIN common/h2 | HEAD="Known limits, workarounds and contributing" }
| Missing | Workaround | Contribute |
|---|---|---|
| Content from a `REF` or a slot is not re-indented to where it is placed | keep `REF`s and slots at the start of a line, not inside indented lists | add re-indenting to the renderer in core (`template/renderer.ts`), with tests |
| The editor has no completion or go-to-definition for section ids and slot names | `glugent list` shows every section id; unknown ids and slots are reported by `glugent validate` | add them to the extension's completion and a definition provider, on top of `loadProject` |
| No loops, expressions or recursive interpolation | use `if` blocks and props | open an issue describing the use case first |
| Prop names cannot contain a hyphen or non-ASCII characters | use `UPPER_SNAKE` or dotted names | change `NAME` in `template/grammar.ts` and the TextMate grammar together |
| No plugin for editors other than VS Code | VS Code forks (Cursor and others) install the same `.vsix`; JetBrains IDEs can load the TextMate grammar for highlighting | a language server built on core would serve every editor |
| Another extension claims `*.md` and hides the Glugent language | add the `files.associations` setting for `*.ggen.md` | none; it is an editor limitation |

If something is not in this table, check the README, the `CHANGELOG.md` of each package and the code before saying it is unsupported.

To contribute: fork the repository, branch from `main`, change the code with tests, update the README, add a changeset, and open a pull request into `main`. See CONTRIBUTING.md.
{ REF END common/h2 }
