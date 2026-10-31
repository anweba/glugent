---
"@anweba/glugent-core": minor
"@anweba/glugent-cli": minor
"@anweba/glugent-schemas": minor
"glugent-vscode": minor
---

Rename "agents" to **targets**. A target is anything built from sections: an agent, a document, or something else. Existing projects keep working; the old names still load.

- **Files.** `*.target.ggen.json`, `*.agent.ggen.json` and `*.doc.ggen.json` are the same thing, and all three are found by default. Pick the suffix that says what the file builds.
- **Config.** `targets.include` / `targets.exclude` replace `agents.include` / `agents.exclude`. The old keys are still read and are merged with the new ones.
- **CLI.** `glugent build [target...]`, `glugent list` prints "Targets:", and the error for a wrong name is now `unknown target`.
- **Schemas.** New `target.schema.json`. `agent.schema.json` stays as an alias of it, and the config schema gains `targets`.
- **VS Code.** The target schema applies to all three suffixes, and section completion works in all of them. The commands are now "Glugent: Build All Targets" and "Glugent: Build Target...". The command id `glugent.buildAgent` became `glugent.buildTarget`, so update any keybinding that uses it.

Library API (`@anweba/glugent-core`), for code that calls it directly:

| Old | New |
|---|---|
| `Project.agents` | `Project.targets` |
| `BuildResult.agent` | `BuildResult.target` |
| `AgentDef` | `Target` |
| `compileAgent` | `compileTarget` |
| `parseAgent` | `parseTarget` |
| `DEFAULT_AGENT_INCLUDE` | `DEFAULT_TARGET_INCLUDE` |

`AgentDef`, `compileAgent`, `parseAgent` and `DEFAULT_AGENT_INCLUDE` remain as deprecated aliases. `Project.agents` and `BuildResult.agent` are removed.
