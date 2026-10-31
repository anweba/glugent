---
description: How releases are cut and published
---
## Releasing

1. After a PR with a changeset is merged to `main`, the Release workflow opens or updates a **Version Packages** PR that bumps versions and writes each package's `CHANGELOG.md`.
2. Review that PR, then merge it when you want to release. Merging publishes the packages to npm, tags the release and creates GitHub Releases whose notes are the changelog entries.

Publishing uses npm **trusted publishing** (OIDC): the Release job proves its identity to npm, so no token is stored. Set it up once:

- Own the `@anweba` scope on npm (an organization or user), with 2FA enabled.
- For each of `@anweba/glugent-core`, `-cli` and `-schemas`: npmjs.com → the package → **Settings → Trusted Publisher → GitHub Actions**, with organization/user `anweba`, repository `glugent`, workflow filename `release.yml` (leave environment empty). The package must already exist to be configured, so publish the very first version (`0.2.0`) by hand: `npm login`, then `npm publish --access public -w <package>` after `npm run build`; later releases are automatic.
- Optionally, once trusted publishing works, set each package's **Publishing access** to *Require two-factor authentication and disallow tokens*.

The workflow needs `id-token: write`, Node 24 (npm >= 11.5.1) and a GitHub-hosted runner; the `repository.url` in each `package.json` must match this repo. Trusted publishing also generates provenance for public packages.

`@anweba/glugent-core`, `-cli` and `-schemas` are published publicly (`publishConfig.access`); `dist/test` is left out of the tarballs. `glugent-vscode` is `private` so it is versioned and tagged but never pushed to npm. Releases from `release/**` branches go out under the `maintenance` dist-tag, so an old line never becomes `latest`.

