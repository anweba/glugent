# glugent

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
