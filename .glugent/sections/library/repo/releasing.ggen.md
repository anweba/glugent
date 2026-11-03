---
description: How releases are cut and published
---
{ REF BEGIN common/h2 | HEAD="Releasing" }
1. After a PR with a changeset is merged to `main`, the Release workflow opens or updates a **Version Packages** PR that bumps versions and writes each package's `CHANGELOG.md`.
2. Review that PR, then merge it when you want to release. Merging publishes the packages to npm, tags the release and creates GitHub Releases whose notes are the changelog entries.

The workflow splits this into jobs by what each needs: `version` opens or updates the Version Packages PR (repository and PR write access, no publish identity); `build` builds the npm packages' `dist/` and, on `main`, the extension's `.vsix`, with read access only; `release-prepare` runs `changesets/action` with `changeset tag` in place of a publish, which tags every bumped package (`<name>@<version>`), pushes the tags and creates a GitHub Release for each from its changelog entry; then `publish-npm` and `publish-extension` publish what `build` made. No job can both write to the repository and request a publish identity token, and the publish jobs run neither a build nor an install script, only the publishing tool from the lockfile. Tags and releases are made before publishing: if a publish job fails, re-run only that job.

Publishing uses npm **trusted publishing** (OIDC): the `publish-npm` job proves its identity to npm, so no token is stored. It runs in the GitHub environment **publish-npm**, which `main` and `release/**` may use. Set it up once:

- Own the `@anweba` scope on npm (an organization or user), with 2FA enabled.
- For each of `@anweba/glugent-core`, `@anweba/glugent-schemas` and `glugent` (the CLI): npmjs.com → the package → **Settings → Trusted Publisher → GitHub Actions**, with organization/user `anweba`, repository `glugent`, workflow filename `release.yml`, environment `publish-npm`. The package must already exist to be configured, so publish its very first version by hand: `npm login`, then `npm publish --access public -w <package>` after `npm run build`; later releases are automatic.
- Optionally, once trusted publishing works, set each package's **Publishing access** to *Require two-factor authentication and disallow tokens*.

The workflow needs `id-token: write`, Node 24 (npm >= 11.5.1) and a GitHub-hosted runner; the `repository.url` in each `package.json` must match this repo. Trusted publishing also generates provenance for public packages.

`@anweba/glugent-core`, `@anweba/glugent-schemas` and `glugent` are published publicly (`publishConfig.access`); `dist/test` is left out of the tarballs. `glugent-vscode` is `private` so it is versioned and tagged but never pushed to npm.

The extension is published by the same workflow, to the VS Code Marketplace (publisher `anweba`) and to Open VSX (namespace `anweba`). It runs on `main` once a Version Packages PR is merged, alongside the npm publish: the `publish-extension` job, in the GitHub environment **publish-extension** (only `main` may use it, and a run waits for a reviewer's approval), publishes the `.vsix` from `build` with `--skip-duplicate`, so a release that does not bump the extension publishes nothing. Both registries use trusted publishing: a trusted publisher registered on open-vsx.org, and a Trusted Publishing policy on the Marketplace publisher `anweba`, each for `anweba/glugent`, workflow `release.yml` and environment `publish-extension`, let the job exchange its OIDC identity for a short-lived token, so no publish token is stored. To publish by hand: `npm run package -w glugent-vscode`, then in `packages/vscode` run `npx vsce publish --packagePath <file>.vsix -p <Azure DevOps token>` and `npx ovsx publish <file>.vsix -p <Open VSX access token>`. Releases from `release/**` branches go out under the `maintenance` dist-tag, so an old line never becomes `latest`.

Keep the workflows hardened when you change them:

- Each job declares its own `permissions:`; the Release workflow grants nothing by default; only `version` and `release-prepare` may write to the repository, and only `publish-npm` and `publish-extension` may request an identity token.
- Third-party actions are pinned to a commit SHA with the version in a comment; Dependabot (`.github/dependabot.yml`) opens PRs to update them. Do not switch back to tags such as `@v4`.
- Dependabot also opens weekly PRs for npm dependencies: minor and patch updates grouped into one PR for production and one for development dependencies, majors one by one, each only once the release is at least 7 days old (14 for majors). An update within the existing range changes only `package-lock.json`; one that changes a published package's `package.json` needs a changeset, which you add to the Dependabot PR before merging it.
- Dependencies are installed with `npm ci --ignore-scripts`, so no install script runs where a token or write access is available. If a new dependency needs its install script, find another way rather than dropping the flag.
- `.github/CODEOWNERS` requires the owner's review for workflows, hooks, the changeset config and the `package.json` files.
{ REF END common/h2 }
