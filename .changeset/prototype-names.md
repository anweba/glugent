---
"@anweba/glugent-core": patch
"glugent": patch
"glugent-vscode": patch
---

Prop and slot names that are also JavaScript object members, such as `constructor`, `toString` or `__proto__`, are now ordinary names. Before, an unfilled optional slot named `toString` or `constructor` rendered `[object Undefined]` or `[object Object]`, a slot named `__proto__` crashed the build, and `glugent build --set __proto__=x` was ignored. The extension's hover no longer shows such members as section defaults or config values, and it shows values from the project as inline code they cannot break out of, in Markdown that runs no command links or HTML.
