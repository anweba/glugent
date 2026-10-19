import { test, mock } from "node:test";
import assert from "node:assert";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { ProjectStore } from "../project-store";
import { RefreshScheduler } from "../refresh-scheduler";
import { configOf, createProject, documentAt } from "./fixtures";
import { reset, state } from "./vscode-stub";

function setup() {
  reset();
  const root = createProject({ "s.ggen.md": "x", "notes.txt": "plain" });
  const store = new ProjectStore(new DiagnosticsPublisher());
  let refreshes = 0;
  const refresh = store.refresh.bind(store);
  store.refresh = (config) => {
    refreshes++;
    return refresh(config);
  };
  new RefreshScheduler(store).register();
  return { root, count: () => refreshes };
}

test("debounces rapid edits into one refresh", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { root, count } = setup();
    const doc = documentAt(`${root}/s.ggen.md`);
    for (let i = 0; i < 5; i++) state.listeners.get("change")!({ document: doc });
    mock.timers.tick(249);
    assert.equal(count(), 0);
    mock.timers.tick(1);
    assert.equal(count(), 1);
  } finally {
    mock.timers.reset();
  }
});

test("ignores files that are not part of a Glugent project", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { root, count } = setup();
    state.listeners.get("save")!(documentAt(`${root}/notes.txt`, "plaintext"));
    mock.timers.tick(1000);
    assert.equal(count(), 0);
  } finally {
    mock.timers.reset();
  }
});

test("listens for file creation, deletion and rename", () => {
  const { } = setup();
  for (const event of ["create", "delete", "rename", "open", "save", "change"]) {
    assert.ok(state.listeners.has(event), event);
  }
});
