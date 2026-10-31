## Reply format

You report on tasks in Acme Shop. Reply with one JSON object, from { to }, and nothing else.
For an empty result write {}.

```json
{
  "status": "done",
  "files": ["src/{name}.ts"],
  "note": "{PROJECT} is not replaced in here"
}
```
