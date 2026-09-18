import { test } from "node:test";
import assert from "node:assert/strict";
import { makeGlm } from "../src/core/providers/glm.js";

const GLM_SAMPLE = {
  success: true,
  data: {
    level: "vip4",
    limits: [
      { type: "TOKENS_LIMIT", number: 5, remaining: "72000", currentValue: "28000", percentage: 28, nextResetTime: 1760000000000 },
      { type: "TOKENS_LIMIT", number: 7, remaining: "42000", currentValue: "58000", percentage: 58, nextResetTime: 1760100000000 },
    ],
  },
};

function fakeFetch(json) {
  const calls = [];
  return {
    calls,
    fetchJson: async (url, headers) => {
      calls.push({ url, headers });
      return { status: 200, json, text: JSON.stringify(json) };
    },
  };
}

test("glm:精确 remaining 计算,5h + week 两段", async () => {
  const f = fakeFetch(GLM_SAMPLE);
  const data = await makeGlm(f.fetchJson)({ baseUrl: "https://open.bigmodel.cn/api", token: "t" });
  assert.equal(data.level, "vip4");
  assert.equal(data.quotas.length, 2);
  assert.deepEqual(data.quotas[0], { leftPercent: 72, resetMs: 1760000000000, kind: "5h" });
  assert.deepEqual(data.quotas[1], { leftPercent: 42, resetMs: 1760100000000, kind: "week" });
  assert.equal(f.calls[0].headers.Authorization, "t"); // 不带 Bearer
});

test("glm:缺失 remaining 时回退 percentage", async () => {
  const sample = {
    success: true,
    data: { level: "", limits: [{ type: "TOKENS_LIMIT", number: 5, percentage: 35 }] },
  };
  const data = await makeGlm(fakeFetch(sample).fetchJson)({ baseUrl: "https://open.bigmodel.cn", token: "t" });
  assert.equal(data.quotas[0].leftPercent, 65);
  assert.equal(data.quotas[0].resetMs, null);
});

test("glm:z.ai 走国际端点", async () => {
  const f = fakeFetch(GLM_SAMPLE);
  await makeGlm(f.fetchJson)({ baseUrl: "https://api.z.ai/api", token: "t" });
  assert.ok(f.calls[0].url.startsWith("https://api.z.ai"));
});

test("glm:success 非 true → null", async () => {
  const data = await makeGlm(fakeFetch({ success: false }).fetchJson)({ baseUrl: "https://open.bigmodel.cn", token: "t" });
  assert.equal(data, null);
});

test("glm:无 TOKENS_LIMIT → null", async () => {
  const data = await makeGlm(fakeFetch({ success: true, data: { limits: [] } }).fetchJson)({ baseUrl: "https://open.bigmodel.cn", token: "t" });
  assert.equal(data, null);
});
