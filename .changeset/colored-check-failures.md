---
"glugent": patch
---

`glugent build` and `build --check` color their results on a terminal: a green ✓ for written and up-to-date targets, failed ones with a red ✗ and yellow text, and the `Run 'glugent build'` hint in grey. Set `NO_COLOR` to turn it off, or `FORCE_COLOR=1` to keep it when the output is piped.
