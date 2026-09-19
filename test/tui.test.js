import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runTUI, saveTUIConfig, render, visibleItems, ITEMS } from "../src/tui/index.js";
import { loadConfig } from "../src/shared/config.js";
import { stripAnsi } from "../src/shared/ansi.js";

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ccql-tui-")), "cc-quota-line.json");
}

function baseCfg() {
  return loadConfig(null, { readJsonFn: () => null });
}

test("runTUI 在非 TTY 时输出提示", async () => {
  let output = "";
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    output += chunk;
    return true;
  };
  try {
    await runTUI({ configPath: tmpFile() });
  } finally {
    process.stdout.write = originalWrite;
  }
  assert.match(output, /交互式终端/);
});

test("saveTUIConfig 写入修改值并保留 install", () => {
  const f = tmpFile();
  const cfg = loadConfig(f);
  cfg.theme = "light";
  cfg.barWidth = 20;
  cfg.install = { installed: true };
  saveTUIConfig(cfg, f);

  const saved = loadConfig(f);
  assert.equal(saved.theme, "light");
  assert.equal(saved.barWidth, 20);
  assert.deepEqual(saved.install, { installed: true });
});

test("render 预览包含状态栏输出与配置列表", () => {
  const cfg = baseCfg();
  const text = stripAnsi(render(cfg, 0, null));
  assert.match(text, /Preview/);
  assert.match(text, /GLM/);
  assert.match(text, /¥23\.45/);
  assert.match(text, /theme/);
  assert.match(text, /bar-width/);
  assert.match(text, /保存/);
});

test("color-* 项仅在 theme=custom 时可见", () => {
  const dark = baseCfg();
  assert.equal(visibleItems(dark).some((i) => i.kebab === "color-ok"), false);
  assert.ok(!stripAnsi(render(dark, 0, null)).includes("color-ok"));

  const custom = baseCfg();
  custom.theme = "custom";
  assert.equal(visibleItems(custom).length, ITEMS.length);
  const text = stripAnsi(render(custom, 1, null));
  assert.match(text, /color-ok/);
  assert.match(text, /输入色值/);
});

test("色值输入模式渲染输入位与提示", () => {
  const cfg = baseCfg();
  cfg.theme = "custom";
  const item = visibleItems(cfg)[1];
  const text = stripAnsi(render(cfg, 1, null, { item, buf: "87af" }));
  assert.match(text, /color-ok: #87af__/);
  assert.match(text, /\[Enter\] 应用/);
  assert.match(text, /\[Esc\] 取消/);
});
