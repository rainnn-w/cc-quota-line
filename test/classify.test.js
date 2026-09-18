import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "../src/core/classify.js";

test("空/非法 baseUrl → official", () => {
  assert.equal(classify("").key, "official");
  assert.equal(classify("not a url").key, "official");
  assert.equal(classify(undefined).key, "official");
});

test("GLM 域名", () => {
  for (const u of ["https://open.bigmodel.cn/api", "https://api.z.ai/v1", "https://foo.bigmodel.cn"]) {
    const r = classify(u);
    assert.equal(r.key, "glm");
    assert.equal(r.label, "GLM");
  }
});

test("MiniMax 域名", () => {
  for (const u of ["https://api.minimaxi.com/v1", "https://api.minimax.io", "https://x.minimax.chat"]) {
    assert.equal(classify(u).key, "minimax");
  }
});

test("MiMo / Kimi / DeepSeek / official", () => {
  assert.equal(classify("https://api.xiaomimimo.com/v1").key, "mimo");
  assert.equal(classify("https://api.moonshot.cn/v1").key, "moonshot");
  assert.equal(classify("https://api.kimi.com/v1").label, "Kimi");
  assert.equal(classify("https://api.deepseek.com/v1").key, "deepseek");
  assert.equal(classify("https://api.anthropic.com").key, "official");
});

test("其余 → newapi,标签取主域名段", () => {
  const r = classify("https://api.sduonline.com/v1");
  assert.equal(r.key, "newapi");
  assert.equal(r.label, "sduonline");
  assert.equal(r.host, "api.sduonline.com");
});

test("www 前缀剥离", () => {
  assert.equal(classify("https://www.example.com/v1").label, "example");
});
