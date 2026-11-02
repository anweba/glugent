---
"glugent-vscode": patch
---

Security: the extension now declares how it behaves in an untrusted workspace. In Restricted Mode, highlighting, diagnostics, completion, hovers and *Validate Project* work, while *Build All Targets* and *Build Target…* are hidden, and refuse with a warning if run some other way, because they write files. The extension also declares that it does not support virtual workspaces, as it needs the files on disk.
