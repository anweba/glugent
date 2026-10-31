# glugent-vscode

## 0.3.1

### Patch Changes

- [#22](https://github.com/anweba/glugent/pull/22) [`3d5706c`](https://github.com/anweba/glugent/commit/3d5706c4d7f167dbe0be25a29a7aee12e141fd0e) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - The packages and the VS Code extension are now licensed under **MIT**: each has `"license": "MIT"` and includes the `LICENSE` file.

  Each package also has a README on npm (how to install and use it, with links to the documentation, the examples, its changelog and the other packages), and a `description` and `keywords`, so it shows up in npm search.

## 0.3.0

### Minor Changes

- [#17](https://github.com/anweba/glugent/pull/17) [`9f052c4`](https://github.com/anweba/glugent/commit/9f052c4b5b48f7a474692cfe2a399d2f7f6484dd) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - A `REF` can pass props to the section it includes: `{ REF common/h2 | HEAD="How you review" LEVEL=2 }`. It works on `REF`, `REF-OVERRIDE` and `REF BEGIN` (not on END tags).

  - A quoted value is a template rendered with the including section's props, so `HEAD="{TITLE} rules"` passes the includer's `TITLE`. A required prop missing there is the including section's error. Inside the quotes, `\"`, `\\` and `\n` escape, and literal braces are `{{` / `}}`.
  - `true`, `false` and numbers are written bare (`STRICT=true`), so they work in conditions; the string `"false"` would count as set.
  - Precedence for the included section: its own `defaults` → target props → the including section's props (`REF-OVERRIDE`) → **passed props** → config props → `--set`.
  - Props are separated by spaces; passing one twice, or a value that is not quoted, `true`, `false` or a number, is an error.
  - Library API: `TemplateRef.props` holds the passed props, already rendered.
  - The editor extension highlights the passed props.

- [#13](https://github.com/anweba/glugent/pull/13) [`df85f1e`](https://github.com/anweba/glugent/commit/df85f1ef192bd7ed523bbd0ba27e7eada630625e) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Sections can include other sections. `{ REF section/id }` renders another section in place, as if the target listed it there: it uses its own prop layers (its `defaults`, then target, config and CLI props), not the including section's. `{ REF-OVERRIDE section/id }` does the same but lays the including section's props on top, so they win wherever both set a prop.

  - The id is resolved like a target entry: the full id or a unique suffix.
  - A `REF` alone on its line that renders nothing removes the line, like an empty optional prop.
  - A `REF` to an unknown section and a section that includes itself (`a` → `b` → `a`) are errors reported at the `REF`. A missing required prop in an included section names the chain (`section 'b' (via 'a')`).
  - `{REF}`, `{SLOT}` and `{if}` are still ordinary props; `BEGIN` and `END` are reserved and cannot be used as section ids after `REF`.
  - `renderTemplate`'s third argument can now be an options object, `{ lineOffset, renderRef, slots }`, besides the line offset; `renderRef` renders each `REF`, and without it a `REF` is left as written.
  - The editor extension highlights `REF` and `REF-OVERRIDE`.

- [#15](https://github.com/anweba/glugent/pull/15) [`8058697`](https://github.com/anweba/glugent/commit/8058697279093f608596cb7669356a4f0de8d713) Thanks [@AnToniceQ](https://github.com/AnToniceQ)! - Sections can define **slots** that the including side fills.

  - `{ # }` is a required slot and `{ #? }` an optional one; `{ #name }` / `{ #name? }` name it (unnamed is `default`). A slot must be alone on its line, names are unique in a section, and `{- #? -}` trims like `{-NAME?-}` when the slot is empty.
  - `{ REF BEGIN id } ... { REF END id }` (or `REF-OVERRIDE`) includes a section and fills its slots. Its content fills `default`, or it holds only `{ SLOT BEGIN name } ... { SLOT END name }` blocks (no name: `default`). Content can use every feature, including the including section's own slots.
  - Slot content renders with the including section's props. `{ SLOT-INHERIT BEGIN name }` content sees the filled section's props first and falls back to the including section's.
  - Target entries can fill slots too: `{ "use": "card", "slots": { "default": "text, or { REF parts/body }" } }`. The text renders with the entry's props.
  - Errors: a plain `{ REF id }` (or a target entry) that leaves a required slot empty, filling a slot the section does not define, filling one twice, and a REF block that mixes SLOT blocks with other content.
  - `{SLOT}`, `{REF}`, `{BEGIN}` and `{END}` are still ordinary props.
  - Library API: `Section.slots` lists a section's slots, `SectionRef.slots` holds an entry's fills, `scanTemplate` returns `slots`, and `renderTemplate` takes `slots` in its options and returns `missingSlots`.
  - The target schema accepts `slots` on section entries; the editor extension highlights slots and `REF` / `SLOT` blocks.

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
