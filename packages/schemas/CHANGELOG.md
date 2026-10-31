# @anweba/glugent-schemas

## 0.4.0

### Minor Changes

- [#15](https://github.com/anweba/glugent/pull/15) [`8058697`](https://github.com/anweba/glugent/commit/8058697279093f608596cb7669356a4f0de8d713) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Sections can define **slots** that the including side fills.

  - `{ # }` is a required slot and `{ #? }` an optional one; `{ #name }` / `{ #name? }` name it (unnamed is `default`). A slot must be alone on its line, names are unique in a section, and `{- #? -}` trims like `{-NAME?-}` when the slot is empty.
  - `{ REF BEGIN id } ... { REF END id }` (or `REF-OVERRIDE`) includes a section and fills its slots. Its content fills `default`, or it holds only `{ SLOT BEGIN name } ... { SLOT END name }` blocks (no name: `default`). Content can use every feature, including the including section's own slots.
  - Slot content renders with the including section's props. `{ SLOT-INHERIT BEGIN name }` content sees the filled section's props first and falls back to the including section's.
  - Target entries can fill slots too: `{ "use": "card", "slots": { "default": "text, or { REF parts/body }" } }`. The text renders with the entry's props.
  - Errors: a plain `{ REF id }` (or a target entry) that leaves a required slot empty, filling a slot the section does not define, filling one twice, and a REF block that mixes SLOT blocks with other content.
  - `{SLOT}`, `{REF}`, `{BEGIN}` and `{END}` are still ordinary props.
  - Library API: `Section.slots` lists a section's slots, `SectionRef.slots` holds an entry's fills, `scanTemplate` returns `slots`, and `renderTemplate` takes `slots` in its options and returns `missingSlots`.
  - The target schema accepts `slots` on section entries; the editor extension highlights slots and `REF` / `SLOT` blocks.

## 0.3.0

### Minor Changes

- [#10](https://github.com/anweba/glugent/pull/10) [`91191f7`](https://github.com/anweba/glugent/commit/91191f70066462a382bbe65976af77f45ba7c958) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Rename "agents" to **targets**. A target is anything built from sections: an agent, a document, or something else. Existing projects keep working; the old names still load.

  - **Files.** `*.target.ggen.json`, `*.agent.ggen.json` and `*.doc.ggen.json` are the same thing, and all three are found by default. Pick the suffix that says what the file builds.
  - **Config.** `targets.include` / `targets.exclude` replace `agents.include` / `agents.exclude`. The old keys are still read and are merged with the new ones.
  - **CLI.** `glugent build [target...]`, `glugent list` prints "Targets:", and the error for a wrong name is now `unknown target`.
  - **Schemas.** New `target.schema.json`. `agent.schema.json` stays as an alias of it, and the config schema gains `targets`.
  - **VS Code.** The target schema applies to all three suffixes, and section completion works in all of them. The commands are now "Glugent: Build All Targets" and "Glugent: Build Target...". The command id `glugent.buildAgent` became `glugent.buildTarget`, so update any keybinding that uses it.

  Library API (`@anweba/glugent-core`), for code that calls it directly:

  | Old                     | New                      |
  | ----------------------- | ------------------------ |
  | `Project.agents`        | `Project.targets`        |
  | `BuildResult.agent`     | `BuildResult.target`     |
  | `AgentDef`              | `Target`                 |
  | `compileAgent`          | `compileTarget`          |
  | `parseAgent`            | `parseTarget`            |
  | `DEFAULT_AGENT_INCLUDE` | `DEFAULT_TARGET_INCLUDE` |

  `AgentDef`, `compileAgent`, `parseAgent` and `DEFAULT_AGENT_INCLUDE` remain as deprecated aliases. `Project.agents` and `BuildResult.agent` are removed.

## 0.2.0

### Minor Changes

- [#1](https://github.com/anweba/glugent/pull/1) [`7355045`](https://github.com/anweba/glugent/commit/7355045dbcdd7eada5114cb69116855d4fa6bd26) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Move the packages to the `@anweba` npm scope.

  Migration: replace the old names in your `package.json` and imports.

  | Old                | New                       |
  | ------------------ | ------------------------- |
  | `@glugent/core`    | `@anweba/glugent-core`    |
  | `@glugent/cli`     | `@anweba/glugent-cli`     |
  | `@glugent/schemas` | `@anweba/glugent-schemas` |

  The `glugent` command and the `glugent-vscode` extension keep their names.

### Patch Changes

- [`48e85ce`](https://github.com/anweba/glugent/commit/48e85ce9011eb74b78b596e89698e64ce682ba7f) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Add `repository`, `homepage` and `bugs` to the package manifests, and point the changelog generator at `anweba/glugent`.
