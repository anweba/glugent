---
"@anweba/glugent-core": patch
"glugent": patch
"glugent-vscode": patch
---

Security: loading a project no longer reads files outside it. A section or target glob that matches a file outside the config file's directory (with `../` or an absolute pattern), or a symbolic link that leads outside it or into a `.git` folder, is now reported as an error on the config file and the file is not read. Before, a cloned project could copy any file you can read, such as `~/.ssh/id_rsa`, into a built file. Symbolic links to folders are no longer followed while looking for files; symbolic links to files inside the project still work.
