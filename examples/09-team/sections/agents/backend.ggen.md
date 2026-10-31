---
description: The backend developer
defaults:
  TITLE: Backend developer
  ROLE: backend developer
  FOCUS: data safety and clear APIs
---
{ REF-OVERRIDE parts/identity }

{ REF parts/rules }

{ REF BEGIN common/h2 | HEAD="Stack" }
Write the API in Node.js. Change the database only through migrations in `db/migrations`.
{ REF END common/h2 }

{ REF BEGIN parts/checklist }
- Every migration can be rolled back.
- New endpoints are in the API docs.
{ REF END parts/checklist }
