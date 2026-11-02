---
"@anweba/glugent-core": patch
"glugent": patch
"@anweba/glugent-schemas": patch
"glugent-vscode": patch
---

Security: a build no longer writes outside the project. An `outDir` or target `output` that leads outside the config file's directory (directly, as an absolute path, or through a symbolic link), into a `.git` folder, or to a symbolic link is now an error, and the target is not written. Before, building a cloned project could overwrite any file you can write, such as `~/.bashrc` or a git hook. `writeBuild` now also refuses a result that has errors, and opens the output file without following a symbolic link (except on Windows).
