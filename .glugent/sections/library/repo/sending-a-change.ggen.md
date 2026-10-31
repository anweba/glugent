---
description: How to send a change as a pull request
---
{ REF BEGIN common/h2 | HEAD="Sending a change" }
1. Fork the repo, clone your fork and create a branch.
2. Change the code and update the README if behaviour or syntax changed.
3. Run `npm run changeset`, select the affected packages and the bump, and write the entry. It is plain Markdown of any length (headings, lists, a migration note). Commit the generated file in `.changeset/` with your change. CI fails on a PR that changes a package without one (`npm run changeset -- --empty` if nothing needs releasing).
4. Push the branch to your fork and open a PR against `main`. Use Conventional-style PR titles (`feat:`, `fix:`, `docs:`) for a readable history; they do not drive versioning, changesets do.

You never version, tag or release anything yourself; maintainers do that.
{ REF END common/h2 }
