# glugent

## 0.4.0

### Patch Changes

- Updated dependencies [[`df85f1e`](https://github.com/anweba/glugent/commit/df85f1ef192bd7ed523bbd0ba27e7eada630625e), [`8058697`](https://github.com/anweba/glugent/commit/8058697279093f608596cb7669356a4f0de8d713)]:
  - @anweba/glugent-core@0.4.0

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

- [#12](https://github.com/anweba/glugent/pull/12) [`03b4526`](https://github.com/anweba/glugent/commit/03b452649202f6812217c8b3b5f1ec4bec8a5588) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - The CLI package is renamed from `@anweba/glugent-cli` to **`glugent`**, so the package name matches the `glugent` command. Install it with `npm i -D glugent` or run it with `npx glugent`. The command, its options and its output are unchanged.

  `@anweba/glugent-cli` gets no further releases; replace it with `glugent` in your `package.json`. `@anweba/glugent-core` and `@anweba/glugent-schemas` keep their names.

### Patch Changes

- Updated dependencies [[`9a77c5b`](https://github.com/anweba/glugent/commit/9a77c5bb1594b023b8b4fee12ceba3fc08d248c3), [`91191f7`](https://github.com/anweba/glugent/commit/91191f70066462a382bbe65976af77f45ba7c958)]:
  - @anweba/glugent-core@0.3.0

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

- Updated dependencies [[`7355045`](https://github.com/anweba/glugent/commit/7355045dbcdd7eada5114cb69116855d4fa6bd26), [`48e85ce`](https://github.com/anweba/glugent/commit/48e85ce9011eb74b78b596e89698e64ce682ba7f)]:
  - @anweba/glugent-core@0.2.0
