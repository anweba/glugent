# glugent-vscode

## 0.2.0

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

### Patch Changes

- [#9](https://github.com/anweba/glugent/pull/9) [`9a77c5b`](https://github.com/anweba/glugent/commit/9a77c5bb1594b023b8b4fee12ceba3fc08d248c3) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Prop names can no longer contain a hyphen. A name is now an ASCII letter or `_` followed by letters, digits, `_` or `.`, so `{test-runner}` is an error and must be renamed (for example `{test_runner}`). The editor highlighting and completion follow the same rule.

- [#7](https://github.com/anweba/glugent/pull/7) [`37c5dfb`](https://github.com/anweba/glugent/commit/37c5dfbdbd9b7f6957c1f103ac0c0723504370a1) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Stop highlighting and bracket-colouring the braces inside `{! … !}` raw blocks and in `{{` / `}}` literals, and give placeholder names a colour that stands out in default themes.

## 0.1.2

### Patch Changes

- [#5](https://github.com/anweba/glugent/pull/5) [`0f297d3`](https://github.com/anweba/glugent/commit/0f297d3770b55ab4b688b948078fa82033ae5352) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Fix editor behaviour for `.ggen.md` files: claim them by filename pattern and refresh diagnostics when any Markdown file is edited.

## 0.1.1

### Patch Changes

- [#1](https://github.com/anweba/glugent/pull/1) [`7355045`](https://github.com/anweba/glugent/commit/7355045dbcdd7eada5114cb69116855d4fa6bd26) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Move the packages to the `@anweba` npm scope.

  Migration: replace the old names in your `package.json` and imports.

  | Old                | New                       |
  | ------------------ | ------------------------- |
  | `@glugent/core`    | `@anweba/glugent-core`    |
  | `@glugent/cli`     | `@anweba/glugent-cli`     |
  | `@glugent/schemas` | `@anweba/glugent-schemas` |

  The `glugent` command and the `glugent-vscode` extension keep their names.

- [`48e85ce`](https://github.com/anweba/glugent/commit/48e85ce9011eb74b78b596e89698e64ce682ba7f) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Add `repository`, `homepage` and `bugs` to the package manifests, and point the changelog generator at `anweba/glugent`.
