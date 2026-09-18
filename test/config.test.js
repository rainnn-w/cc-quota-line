import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, setConfigValue, unsetConfigValue, resetConfig } from "../src/shared/config.js";

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ccql-")), "cc-quota-line.json");
}

test("空文件 → 全默认值", () => {
  const cfg = loadConfig(tmpFile());
  assert.equal(cfg.schemaVersion, 1);
  assert.equal(cfg.cacheTtlSeconds, 90);
  assert.equal(cfg.barWidth, 10);
  assert.equal(cfg.theme, "dark");
});

test("未知键丢弃,非法值回落默认", () => {
  const f = tmpFile();
  fs.writeFileSync(f, JSON.stringify({ bogus: 1, barWidth: 999, theme: "pink", timeoutMs: "abc" }));
  const cfg = loadConfig(f);
  assert.equal("bogus" in cfg, false);
  assert.equal(cfg.barWidth, 10);
  assert.equal(cfg.theme, "dark");
  assert.equal(cfg.timeoutMs, 4000);
});

test("set 合法值原子写入并持久化", () => {
  const f = tmpFile();
  const r = setConfigValue(f, "bar-width", "16");
  assert.equal(r.ok, true);
  assert.equal(r.value, 16);
  assert.equal(loadConfig(f).barWidth, 16);
  assert.equal(fs.readdirSync(path.dirname(f)).filter((n) => n.startsWith(".tmp-")).length, 0);
});

test("set 越界/未知键/只读键报错", () => {
  const f = tmpFile();
  assert.ok(setConfigValue(f, "bar-width", "999").error);
  assert.ok(setConfigValue(f, "no-such-key", "1").error);
  assert.ok(setConfigValue(f, "schemaversion", "2").error);
  assert.ok(setConfigValue(f, "install", "x").error);
});

test("unset 恢复默认;reset 保留 install", () => {
  const f = tmpFile();
  setConfigValue(f, "bar-width", "16");
  const ok1 = unsetConfigValue(f, "bar-width");
  assert.equal(ok1.value, 10);
  setConfigValue(f, "theme", "light");
  fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, "utf8")), install: { installed: true } }));
  resetConfig(f);
  const cfg = loadConfig(f);
  assert.equal(cfg.theme, "dark");
  assert.deepEqual(cfg.install, { installed: true });
});
