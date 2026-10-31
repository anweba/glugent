---
description: How the agent works through a task, depending on what the project has
---
## Workflow

- Read the task first{ if TICKET_URL {, at {TICKET_URL}} }.
{ if TYPESCRIPT {
- Write TypeScript with strict types.
} else if JAVASCRIPT {
- Write modern JavaScript.
} else {
- Use the language the file is already written in.
} }
{ if TESTS {
- Run `{TEST_COMMAND?"npm test"}` before you hand in.
{ if !CI {
- Nothing runs the tests for you, so do not skip this.
} }
} }
{ if TESTS !& LINT {
- Some checks are missing, so read your diff once more yourself.
} }
{ if TESTS !| LINT {
- There are no automated checks at all; ask for a human review.
} }
{ if (DOCS || CHANGELOG) && !DRAFT {
- Update the docs and the changelog.
} }
