---
description: How releases are cut and published
---
{ REF BEGIN common/h2 | HEAD="Releasing" }
1. After a PR with a changeset is merged to `main`, the Release workflow opens or updates a **Version Packages** PR that bumps versions and writes each package's `CHANGELOG.md`.
2. Review that PR, then merge it when you want to release. Merging publishes the packages to npm, tags the release and creates GitHub Releases whose notes are the changelog entries.

Publishing uses npm **trusted publishing** (OIDC): the Release job proves its identity to npm, so no token is stored. Set it up once:

- Own the `@anweba` scope on npm (an organization or user), with 2FA enabled.
- For each of `@anweba/glugent-core`, `@anweba/glugent-schemas` and `glugent` (the CLI): npmjs.com → the package → **Settings → Trusted Publisher → GitHub Actions**, with organization/user `anweba`, repository `glugent`, workflow filename `release.yml` (leave environment empty). The package must already exist to be configured, so publish its very first version by hand: `npm login`, then `npm publish --access public -w <package>` after `npm run build`; later releases are automatic.
- Optionally, once trusted publishing works, set each package's **Publishing access** to *Require two-factor authentication and disallow tokens*.

The workflow needs `id-token: write`, Node 24 (npm >= 11.5.1) and a GitHub-hosted runner; the `repository.url` in each `package.json` must match this repo. Trusted publishing also generates provenance for public packages.

`@anweba/glugent-core`, `@anweba/glugent-schemas` and `glugent` are published publicly (`publishConfig.access`); `dist/test` is left out of the tarballs. `glugent-vscode` is `private` so it is versioned and tagged but never pushed to npm.

The extension is published by the `publish-extension` job of the same workflow, to the VS Code Marketplace (publisher `anweba`) and to Open VSX (namespace `anweba`). It runs on `main` once a Version Packages PR is merged, packages the extension and publishes it with `--skip-duplicate`, so a release that does not bump the extension publishes nothing. Its tokens are the secrets `VSCE_PAT` (an Azure DevOps token with the *Marketplace → Manage* scope) and `OVSX_PAT` (an Open VSX access token) of the GitHub environment **Release**, which only `main` may use; only the publish step sees them. The Azure DevOps token expires after at most a year: renew it and update the secret before then. To publish by hand: `npm run package -w glugent-vscode`, then in `packages/vscode` run `npx vsce publish --packagePath <file>.vsix` and `npx ovsx publish <file>.vsix`. Releases from `release/**` branches go out under the `maintenance` dist-tag, so an old line never becomes `latest`.

Keep the workflows hardened when you change them:

- Each job declares its own `permissions:`; the Release workflow grants nothing by default, and only the `release` job may write or request the npm identity token.
- Third-party actions are pinned to a commit SHA with the version in a comment; Dependabot (`.github/dependabot.yml`) opens PRs to update them. Do not switch back to tags such as `@v4`.
- Dependencies are installed with `npm ci --ignore-scripts`, so no install script runs where a token or write access is available. If a new dependency needs its install script, find another way rather than dropping the flag.
- `.github/CODEOWNERS` requires the owner's review for workflows, hooks, the changeset config and the `package.json` files.
{ REF END common/h2 }
