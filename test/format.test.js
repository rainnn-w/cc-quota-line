import { test } from "node:test";
import assert from "node:assert/strict";
import { buildViewModel } from "../src/core/status/viewModel.js";
import { renderLine, renderJson } from "../src/core/status/format.js";
import { stripAnsi } from "../src/shared/ansi.js";

const input = { model: { display_name: "glm-5.1" } };

test("quota 双段渲染", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "glm", label: "GLM" },
    data: {
      level: "vip4",
      quotas: [
        { leftPercent: 72, resetMs: 1760000000000, kind: "5h" },
        { leftPercent: 42, resetMs: 1760100000000, kind: "week" },
      ],
    },
  });
  const line = stripAnsi(renderLine(vm, {}));
  assert.ok(line.startsWith("GLM Vip4 · "));
  assert.match(line, /███████░░░ 72% ↻\d{2}:\d{2}/);
  assert.match(line, /W ████░░░░░░ 42% ↻\d{2}:\d{2}/);
  assert.ok(line.endsWith("glm-5.1"));
});

test("money 渲染", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "newapi", label: "sduonline" },
    data: { money: { left: 8.42, currency: "$", limit: 10 } },
  });
  assert.equal(stripAnsi(renderLine(vm, {})), "sduonline · $8.42 left / $10 · glm-5.1");
});

test("used 渲染(不限量中转站)", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "newapi", label: "x" },
    data: { used: 12.34, money: null },
  });
  assert.equal(stripAnsi(renderLine(vm, {})), "x · used $12.34 · glm-5.1");
});

test("无数据 → hint;official 提示 /usage", () => {
  const vm = buildViewModel({ input, provider: { key: "official", label: "Claude" }, data: null });
  assert.equal(stripAnsi(renderLine(vm, {})), "Claude · run /usage · glm-5.1");
  const vm2 = buildViewModel({ input, provider: { key: "glm", label: "GLM" }, data: null });
  assert.equal(stripAnsi(renderLine(vm2, {})), "GLM · quota n/a · glm-5.1");
});

test("mono 主题无 ANSI;dark 默认带 ANSI", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "glm", label: "GLM" },
    data: { quotas: [{ leftPercent: 72, resetMs: null, kind: "5h" }] },
  });
  assert.equal(renderLine(vm, { theme: "mono" }), "GLM · ███████░░░ 72% · glm-5.1");
  assert.ok(renderLine(vm, {}).includes("\x1b["));
});

test("bar-width 配置生效", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "glm", label: "GLM" },
    data: { quotas: [{ leftPercent: 50, resetMs: null, kind: "5h" }] },
  });
  assert.equal(renderLine(vm, { theme: "mono", barWidth: 4 }), "GLM · ██░░ 50% · glm-5.1");
});

test("light / morandi 主题四档全部生效(不只 ok 档)", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "glm", label: "GLM" },
    data: { quotas: [{ leftPercent: 72, resetMs: null, kind: "5h" }, { leftPercent: 35, resetMs: null, kind: "week" }] },
  });
  // light:ok=#3fb950 深绿、warn=#ff7e1e 深橙、info(model)=#0969DA 深蓝(均 truecolor)
  const light = renderLine(vm, { theme: "light" });
  assert.ok(light.includes("\x1b[38;2;63;185;80m"), "ok 档应为深绿");
  assert.ok(light.includes("\x1b[38;2;255;126;30m"), "warn 档应为深橙");
  assert.ok(light.includes("\x1b[38;2;9;105;218m"), "model 应为深蓝");
  assert.ok(!light.includes("\x1b[97m"), "light 不应再出现亮白");
  // morandi:ok=#87d9c1、warn=#78c4ff、info=#c1cbff(truecolor)
  const morandi = renderLine(vm, { theme: "morandi" });
  assert.ok(morandi.includes("\x1b[38;2;135;217;193m"));
  assert.ok(morandi.includes("\x1b[38;2;120;196;255m"));
  assert.ok(morandi.includes("\x1b[38;2;193;203;255m"));
});

test("custom 主题:四档自定义生效,空档继承 dark", () => {
  const vm = buildViewModel({
    input,
    provider: { key: "glm", label: "GLM" },
    data: { quotas: [{ leftPercent: 72, resetMs: null, kind: "5h" }, { leftPercent: 35, resetMs: null, kind: "week" }] },
  });
  const out = renderLine(vm, { theme: "custom", colorOk: "#87af87", colorWarn: "ansi256:137" });
  assert.ok(out.includes("\x1b[38;2;135;175;135m"), "hex ok 档");
  assert.ok(out.includes("\x1b[38;5;137m"), "ansi256 warn 档");
  assert.ok(out.includes("\x1b[38;2;88;166;255m"), "未设置的 info 档应继承 dark 天空蓝");
});

test("--json 输出结构", () => {
  const out = JSON.parse(
    renderJson({
      provider: { key: "glm", label: "GLM" },
      data: { quotas: [] },
      fetchedAt: "2026-09-18T00:00:00Z",
      input,
    })
  );
  assert.deepEqual(out.provider, { key: "glm", label: "GLM" });
  assert.equal(out.model, "glm-5.1");
  assert.equal(out.fetchedAt, "2026-09-18T00:00:00Z");
});
