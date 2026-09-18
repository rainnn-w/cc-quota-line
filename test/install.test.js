import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { classifyStatusLine, install, uninstall, buildCommand } from "../src/claude/install.js";

function setup(statusLine, installCfg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ccql-inst-"));
  const settingsPath = path.join(dir, "settings.json");
  const configPath = path.join(dir, "cc-quota-line.json");
  fs.writeFileSync(settingsPath, JSON.stringify(statusLine ? { statusLine, other: 1 } : { other: 1 }));
  fs.writeFileSync(configPath, JSON.stringify(installCfg ?? {}));
  return { settingsPath, configPath };
}
const OPTS = { execPath: "C:\\node\\node.exe", scriptPath: "D:\\app\\src\\cli\\index.js" };

test("buildCommand 反斜杠归一 + 引号", () => {
  assert.equal(buildCommand(OPTS), '"C:/node/node.exe" "D:/app/src/cli/index.js"');
});

test("classifyStatusLine 四态", () => {
  assert.equal(classifyStatusLine(undefined), "missing");
  assert.equal(classifyStatusLine({ type: "command", command: '"x" "cc-quota-line/index.js"' }), "managed");
  assert.equal(classifyStatusLine({ type: "command", command: 'node "C:/x/statusline.mjs"' }), "legacy");
  assert.equal(classifyStatusLine({ type: "command", command: "powerline-script" }), "unmanaged");
});

test("install:missing → 写入", () => {
  const { settingsPath, configPath } = setup(undefined);
  const r = install({ settingsPath, configPath, ...OPTS });
  assert.equal(r.status, "installed");
  const s = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  assert.equal(s.statusLine.command, buildCommand(OPTS));
  assert.equal(s.statusLine.managedBy, "cc-quota-line");
  assert.equal(s.other, 1);
  assert.equal(JSON.parse(fs.readFileSync(configPath, "utf8")).install.installed, true);
});

test("install:managed → 原地更新", () => {
  const { settingsPath, configPath } = setup({ type: "command", command: '"old/node.exe" ".../cc-quota-line/cli/index.js"' });
  assert.equal(install({ settingsPath, configPath, ...OPTS }).status, "updated");
  const s = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  assert.equal(s.statusLine.command, buildCommand(OPTS));
});

test("install:legacy → 迁移", () => {
  const { settingsPath, configPath } = setup({ type: "command", command: 'node "C:/Users/x/.claude/statusline.mjs"' });
  const r = install({ settingsPath, configPath, ...OPTS });
  assert.equal(r.status, "migrated");
  assert.equal(JSON.parse(fs.readFileSync(settingsPath, "utf8")).statusLine.managedBy, "cc-quota-line");
});

test("install:unmanaged 无 --force 拒绝,有 --force 备份后替换", () => {
  const foreign = { type: "command", command: "powerline" };
  let s = setup(foreign);
  const r1 = install({ settingsPath: s.settingsPath, configPath: s.configPath, ...OPTS });
  assert.equal(r1.status, "unmanaged_exists");
  assert.equal(JSON.parse(fs.readFileSync(s.settingsPath, "utf8")).statusLine.command, "powerline");

  const r2 = install({ settingsPath: s.settingsPath, configPath: s.configPath, ...OPTS, force: true });
  assert.equal(r2.status, "backed_up_then_installed");
  const settings = JSON.parse(fs.readFileSync(s.settingsPath, "utf8"));
  assert.equal(settings.statusLine.command, buildCommand(OPTS));
  assert.deepEqual(JSON.parse(fs.readFileSync(s.configPath, "utf8")).install.previousStatusLine, foreign);
});

test("uninstall:托管有备份→恢复;无备份→删字段", () => {
  const foreign = { type: "command", command: "powerline" };
  let s = setup(foreign);
  install({ settingsPath: s.settingsPath, configPath: s.configPath, ...OPTS, force: true });
  const r1 = uninstall({ settingsPath: s.settingsPath, configPath: s.configPath });
  assert.equal(r1.status, "restored");
  assert.deepEqual(JSON.parse(fs.readFileSync(s.settingsPath, "utf8")).statusLine, foreign);

  s = setup(undefined);
  install({ settingsPath: s.settingsPath, configPath: s.configPath, ...OPTS });
  const r2 = uninstall({ settingsPath: s.settingsPath, configPath: s.configPath });
  assert.equal(r2.status, "removed");
  assert.equal("statusLine" in JSON.parse(fs.readFileSync(s.settingsPath, "utf8")), false);
});

test("uninstall:非托管不动;缺失→missing", () => {
  let s = setup({ type: "command", command: "powerline" });
  assert.equal(uninstall({ settingsPath: s.settingsPath, configPath: s.configPath }).status, "unmanaged");
  assert.equal(JSON.parse(fs.readFileSync(s.settingsPath, "utf8")).statusLine.command, "powerline");

  s = setup(undefined);
  assert.equal(uninstall({ settingsPath: s.settingsPath, configPath: s.configPath }).status, "missing");
});
