import { num } from "../../shared/utils.js";

export function makeMinimax(fetchJson) {
  return async function queryMinimax(env) {
    const origin = new URL(env.baseUrl).origin;
    const r = await fetchJson(`${origin}/v1/token_plan/remains`, {
      Authorization: `Bearer ${env.token}`,
    });
    // 实际响应:{model_remains:[{model_name, current_interval_remaining_percent, end_time,
    //            current_weekly_remaining_percent, weekly_end_time, ...}, ...]}
    const items = Array.isArray(r.json?.model_remains) ? r.json.model_remains : [];
    const entry = items.find((m) => m?.model_name === "general") ?? items[0];
    if (!entry) return null;

    const quotas = [];
    const p5 = num(entry.current_interval_remaining_percent);
    if (p5 != null) quotas.push({ leftPercent: p5, resetMs: num(entry.end_time), kind: "5h" });
    const pw = num(entry.current_weekly_remaining_percent);
    if (pw != null) quotas.push({ leftPercent: pw, resetMs: num(entry.weekly_end_time), kind: "week" });
    return quotas.length ? { quotas } : null;
  };
}
