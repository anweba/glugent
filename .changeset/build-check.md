---
"glugent": minor
"@anweba/glugent-core": minor
---

`glugent build --check` checks that the built files are up to date without writing anything. It compiles the targets, compares each result with the file on disk and lists every file that is missing or out of date; it exits with 1 if there is any, so it works in CI and in Git hooks. It takes the same target names and `--set` as `build`.

```
$ glugent build --check
✓ readme → README.md (up to date)
✗ helper → agents/helper.md (out of date)
Run 'glugent build' to update the files above.
```

Library API: `checkBuild(result)` returns `"current"`, `"stale"` or `"missing"` for a build result.
