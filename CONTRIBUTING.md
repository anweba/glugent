# Contributing

## Development

```
packages/
  core/     @anweba/glugent-core  – config, discovery, parsing, validation, compilation (single source of truth)
  cli/      @anweba/glugent-cli   – thin wrapper: `glugent build|validate|list`
  vscode/   glugent-vscode – thin wrapper: highlighting, diagnostics, completion, hover, build commands
  schemas/  JSON Schemas for glugent.config.json and agent files
examples/basic/
```

The CLI and the extension both call `@anweba/glugent-core`; nothing is implemented twice. In the CLI, `cli.ts` (the `Cli` class) wires `Arguments`, `Reporter` and one `Command` subclass per subcommand in `commands/`; add a command by subclassing `Command` and registering it in `COMMANDS`. Inside `@anweba/glugent-core` (`packages/core/src`), each folder is one stage, and the public functions (`loadProject`, `compileAgent`, `validateProject`, `renderTemplate`, `scanTemplate`) are thin wrappers over the classes:

| Folder | Classes | Job |
|---|---|---|
| `template/` | `TemplateScanner`, `ConditionParser`, `TemplateRenderer`, `TemplateAnalyzer` | the template language: source → pieces → text, or placeholders and errors for editors (`grammar.ts` holds the regular expressions) |
| `project/` | `ProjectLoader`, `SectionParser`, `AgentParser`, `SectionResolver` | read the config, sections and agents from disk |
| `build/` | `AgentCompiler`, `ProjectValidator` | glue an agent's sections together, validate, write the output |

The extension (`packages/vscode/src`) is a set of small `Feature` classes, each registering itself with VS Code; `extension.ts` only wires them together:

| File | Job |
|---|---|
| `project-store.ts` (`ProjectStore`) | loads and caches projects, reading unsaved editor buffers |
| `diagnostics-publisher.ts` (`DiagnosticsPublisher`) | shows diagnostics in the Problems panel |
| `refresh-scheduler.ts` (`RefreshScheduler`) | refreshes a project shortly after its files change |
| `completion/`, `hover/` | `PropCompletion`, `SectionCompletion`, `PropHover` |
| `commands/` | one `Command` subclass per palette command (add one by subclassing and listing it in `extension.ts`) |

Extension tests (`src/test`) run in plain Node against an in-memory stand-in for the `vscode` module (`vscode-stub.ts`, wired in by `setup.ts`), so they need no VS Code install. Extend the stub when new code uses more of the API.

```bash
npm install && npm run build
npm test                      # builds, then tests core, the CLI and the extension
cd examples/basic
node ../../packages/cli/bin/glugent.js validate
node ../../packages/cli/bin/glugent.js build --set ADDITIONAL_INSTRUCTIONS="Be terse."
```

### Trying it on the example project

```bash
npm run example:validate     # the CLI against examples/basic
npm run example:build        # writes examples/basic/dist/agents/*.md
```

To try the extension, open this repo in VS Code and run **Extension: try on examples/basic** (F5). It builds everything and opens a second window on `examples/basic` with the extension loaded: open a `.ggen.md` file for highlighting, hover and completion (type `{`), break something to see diagnostics in the Problems panel, and use the *Glugent:* commands from the command palette.

### VS Code extension

```bash
cd packages/vscode && npm run package   # produces a glugent-vscode-<version>.vsix
```

Or press F5 in `packages/vscode` with an extension-development launch config. The placeholder grammar (`syntaxes/glugent-injection.tmLanguage.json`) is injected into the Markdown grammar so it works inside lists and code fences; keep it in sync with the syntax in `template.ts`.

## Sending a change

1. Fork the repo, clone your fork and create a branch.
2. Change the code and update the README if behaviour or syntax changed.
3. Run `npm run changeset`, select the affected packages and the bump, and write the entry. It is plain Markdown of any length (headings, lists, a migration note). Commit the generated file in `.changeset/` with your change. CI fails on a PR that changes a package without one (`npm run changeset -- --empty` if nothing needs releasing).
4. Push the branch to your fork and open a PR against `main`. Use Conventional-style PR titles (`feat:`, `fix:`, `docs:`) for a readable history; they do not drive versioning, changesets do.

You never version, tag or release anything yourself; maintainers do that.

### Versioning (0.x = beta)

Glugent is in beta: all packages are `0.x`. Until 1.0.0:

| Change | Bump |
|---|---|
| Breaking (e.g. a syntax change that invalidates existing `.ggen.md` files) | **minor** (`0.1.0` → `0.2.0`) |
| New feature or fix | **patch** (`0.1.0` → `0.1.1`) |

`@anweba/glugent-core` and `@anweba/glugent-cli` are released together (same version); `glugent-vscode` and `@anweba/glugent-schemas` version on their own.

---

# For maintainers

## Releasing

1. After a PR with a changeset is merged to `main`, the Release workflow opens or updates a **Version Packages** PR that bumps versions and writes each package's `CHANGELOG.md`.
2. Review that PR, then merge it when you want to release. Merging tags the release and creates GitHub Releases whose notes are the changelog entries.

## Patching an older release

`main` always releases the next version. To patch an older line (say a fix for `4.x` while `main` is at `6.x`), branch from that line's last tag:

```bash
git checkout -b release/4.x @anweba/glugent-core@4.5.5
# set "baseBranch" in .changeset/config.json to "release/4.x" and commit it
git push -u origin release/4.x
```

Then it works like `main`: land the fix with a `patch` changeset (PR into `release/4.x`), merge the **Version Packages** PR the Release workflow opens against that branch, and the tags and GitHub Releases are created (`4.5.6`). Port the fix to `main` by cherry-pick with its own changeset if it applies there; never merge a release branch into `main`.

Notes:

- `release/**` branches are built by CI and the Release workflow; only `baseBranch` is per-branch.
- Releases are tags first: once the tag is on the remote, the branch can be deleted (the tag keeps the commit alive) and recreated later from the tag. Check `git log <tag>..release/4.x` is empty before deleting.
- GitHub marks the most recently created Release as "latest"; after a patch on an old line, mark the newest version as latest by hand.
