---
description: The release workflow, built from step blocks
defaults:
  SOURCE: the release workflow
---
## Release

{ REF BEGIN blocks/step }
Bump the version number.
{ REF END blocks/step }

{ REF BEGIN blocks/step }
{ SLOT BEGIN }
Write the changelog. This line is written by {SOURCE}.
{ SLOT END }
{ SLOT-INHERIT BEGIN check }
Check that every merged pull request is listed. This line sees {SOURCE}.
{ SLOT END check }
{ SLOT BEGIN notes }
Keep each entry to one line.
{ SLOT END notes }
{ REF END blocks/step }

{ REF BEGIN blocks/risky-step }
Publish the packages to npm.
{ REF END blocks/risky-step }
