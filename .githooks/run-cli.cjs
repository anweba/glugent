// Runs the locally built CLI for the hooks: node run-cli.cjs <glugent arguments>.
// It loads packages/cli/dist and packages/core/dist (built by you, not tracked) by path,
// so no tracked file of the checkout decides what runs: the core package.json's `main`
// is skipped, and the hook itself runs from the installed copy in .git/glugent-hooks/.
const Module = require("module");
const path = require("path");

const root = process.cwd();
const core = path.join(root, "packages/core/dist/index.js");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return request === "@anweba/glugent-core" ? core : resolveFilename.call(this, request, ...rest);
};
require(path.join(root, "packages/cli/dist/cli.js")).main(process.argv.slice(2));
