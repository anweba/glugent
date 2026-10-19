// Loaded with `node --require`: makes `require("vscode")` resolve to the stub.
import Module = require("module");
import * as path from "path";

const stub = path.join(__dirname, "vscode-stub.js");
const internals = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
const resolve = internals._resolveFilename;
internals._resolveFilename = (request, ...rest) => (request === "vscode" ? stub : resolve(request, ...rest));
