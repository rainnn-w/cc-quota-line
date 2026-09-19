import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runTUI, saveTUIConfig } from "../src/tui/index.js";
import { loadConfig } from "../src/shared/config.js";
import { render } from "../src/tui/index.js";
import { stripAnsi } from "../src/shared/ansi.js";

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ccql-tui-")), "cc-quota-line.json");
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
  const cfg = loadConfig(null, { readJsonFn: () => null });
  const text = stripAnsi(render(cfg, 0, null));
  assert.match(text, /Preview/);
  assert.match(text, /GLM/);
  assert.match(text, /¥23\.45/);
  assert.match(text, /theme/);
  assert.match(text, /bar-width/);
  assert.match(text, /保存/);
});
