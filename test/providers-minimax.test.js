import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMinimax } from "../src/core/providers/minimax.js";

const SAMPLE = {
  model_remains: [
    {
      model_name: "general",
      current_interval_remaining_percent: 30.5,
      end_time: 1760000000000,
      current_weekly_remaining_percent: 44,
      weekly_end_time: 1760100000000,
    },
    { model_name: "other", current_interval_remaining_percent: 1 },
  ],
};

test("minimax:general 条目双段", async () => {
  const fetchJson = async () => ({ status: 200, json: SAMPLE, text: "" });
  const data = await makeMinimax(fetchJson)({ baseUrl: "https://api.minimaxi.com/v1", token: "t" });
  assert.deepEqual(data.quotas, [
    { leftPercent: 30.5, resetMs: 1760000000000, kind: "5h" },
    { leftPercent: 44, resetMs: 1760100000000, kind: "week" },
  ]);
});

test("minimax:无 general 时取第一条;Bearer 头", async () => {
  let gotHeaders;
  const fetchJson = async (_u, h) => {
    gotHeaders = h;
    return { status: 200, json: { model_remains: [{ model_name: "x", current_interval_remaining_percent: 10 }] }, text: "" };
  };
  const data = await makeMinimax(fetchJson)({ baseUrl: "https://api.minimaxi.com/v1", token: "tk" });
  assert.equal(data.quotas[0].leftPercent, 10);
  assert.equal(gotHeaders.Authorization, "Bearer tk");
});

test("minimax:空列表 → null", async () => {
  const fetchJson = async () => ({ status: 200, json: { model_remains: [] }, text: "" });
  assert.equal(await makeMinimax(fetchJson)({ baseUrl: "https://api.minimaxi.com", token: "t" }), null);
});
