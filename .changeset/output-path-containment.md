---
"@anweba/glugent-core": minor
"glugent": minor
"@anweba/glugent-schemas": patch
"glugent-vscode": minor
---

**Breaking, for security:** a build no longer writes outside the project. An `outDir` or target `output` that leads outside the config file's directory (directly, as an absolute path, or through a symbolic link), into a `.git` folder, or to a symbolic link is now an error, and the target is not written. Before, building a cloned project could overwrite any file you can write, such as `~/.bashrc` or a git hook. `writeBuild` now also refuses a result that has errors, and opens the output file without following a symbolic link (except on Windows).

To upgrade: if a target writes outside the folder of its `glugent.config.json`, move the config file up to a folder that contains every output, and adjust `outDir`, `output` and the globs, which are relative to it. If you call `writeBuild` yourself, check the result's diagnostics first, as it now throws on errors.
