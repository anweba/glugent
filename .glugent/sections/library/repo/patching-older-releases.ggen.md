---
description: How to patch an older release line
---
{ REF BEGIN common/h2 | HEAD="Patching an older release" }
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
- Packages from a release branch are published with the `maintenance` dist-tag; installing that line is `npm i @anweba/glugent-core@maintenance` or an exact version.
- GitHub marks the most recently created Release as "latest"; after a patch on an old line, mark the newest version as latest by hand.
{ REF END common/h2 }
