import { num } from "../../shared/utils.js";

export function makeNewapi(fetchJson) {
  return async function queryNewapi(env) {
    const origin = new URL(env.baseUrl).origin;
    const auth = { Authorization: `Bearer ${env.token}` };
    const [sub, usage] = await Promise.all([
      fetchJson(`${origin}/v1/dashboard/billing/subscription`, auth),
      fetchJson(`${origin}/v1/dashboard/billing/usage`, auth),
    ]);
    const limit = num(sub.json?.hard_limit_usd ?? sub.json?.system_hard_limit_usd);
    const usedCents = num(usage.json?.total_usage);
    if (limit == null || usedCents == null) return null;
    const used = usedCents / 100;
    // 部分中转站把额度设为占位大数(如 1 亿)表示不限量,此时只显示已用量
    if (limit >= 1_000_000) return { used, money: null };
    return { money: { left: limit - used, currency: "$", limit } };
  };
}
