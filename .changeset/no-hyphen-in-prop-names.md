---
"@anweba/glugent-core": minor
"glugent-vscode": patch
---

Prop names can no longer contain a hyphen. A name is now an ASCII letter or `_` followed by letters, digits, `_` or `.`, so `{test-runner}` is an error and must be renamed (for example `{test_runner}`). The editor highlighting and completion follow the same rule.
