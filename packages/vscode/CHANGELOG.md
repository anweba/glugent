# glugent-vscode

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
