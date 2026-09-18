import { test } from "node:test";
import assert from "node:assert/strict";
import { makeNewapi } from "../src/core/providers/newapi.js";
import { makeDeepseek } from "../src/core/providers/deepseek.js";
import { makeMoonshot } from "../src/core/providers/moonshot.js";

test("newapi:普通额度→money", async () => {
  const fetchJson = async (url) =>
    url.endsWith("/subscription")
      ? { status: 200, json: { hard_limit_usd: 10 }, text: "" }
      : { status: 200, json: { total_usage: 158 }, text: "" }; // 158 分 = $1.58
  const data = await makeNewapi(fetchJson)({ baseUrl: "https://api.sduonline.com/v1", token: "t" });
  assert.deepEqual(data.money, { left: 8.42, currency: "$", limit: 10 });
});

test("newapi:占位大数→只显示已用", async () => {
  const fetchJson = async (url) =>
    url.endsWith("/subscription")
      ? { status: 200, json: { hard_limit_usd: 100000000 }, text: "" }
      : { status: 200, json: { total_usage: 1234 }, text: "" };
  const data = await makeNewapi(fetchJson)({ baseUrl: "https://x.com/v1", token: "t" });
  assert.equal(data.money, null);
  assert.equal(data.used, 12.34);
});

test("newapi:system_hard_limit_usd 回退;缺 usage → null", async () => {
  const ok = async (url) =>
    url.endsWith("/subscription")
      ? { status: 200, json: { system_hard_limit_usd: 5 }, text: "" }
      : { status: 200, json: {}, text: "" };
  assert.equal(await makeNewapi(ok)({ baseUrl: "https://x.com", token: "t" }), null);
});

test("deepseek:CNY 余额", async () => {
  const fetchJson = async () => ({
    status: 200,
    json: { balance_infos: [{ currency: "USD", total_balance: "1" }, { currency: "CNY", total_balance: "10.50" }] },
    text: "",
  });
  const data = await makeDeepseek(fetchJson)({ token: "t" });
  assert.deepEqual(data.money, { left: 10.5, currency: "¥", limit: null });
});

test("moonshot:可用余额", async () => {
  const fetchJson = async () => ({ status: 200, json: { data: { available_balance: "88.8" } }, text: "" });
  const data = await makeMoonshot(fetchJson)({ token: "t" });
  assert.deepEqual(data.money, { left: 88.8, currency: "¥", limit: null });
});
