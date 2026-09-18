import { num } from "../../shared/utils.js";

// 约定返回:null 表示"无可用数据";对象形如
// { quotas: [{ leftPercent, resetMs, kind: "5h"|"week" }], level?, money? }
export function makeGlm(fetchJson) {
  return async function queryGlm(env) {
    const intl = /(^|\.)z\.ai$/.test(new URL(env.baseUrl).host);
    const root = intl ? "https://api.z.ai" : "https://open.bigmodel.cn";
    const r = await fetchJson(`${root}/api/monitor/usage/quota/limit`, {
      Authorization: env.token, // 智谱该接口直接放 token,不带 Bearer
    });
    if (!r.json || r.json.success !== true) return null;
    const limits = Array.isArray(r.json.data?.limits) ? r.json.data.limits : [];
    const tokenLimits = limits.filter((l) => l?.type === "TOKENS_LIMIT");
    if (tokenLimits.length === 0) return null;

    const toQuota = (l) => {
      // 优先用 remaining/currentValue 精确计算;缺失时回退到 percentage(已用百分比)
      const remaining = num(l.remaining);
      const current = num(l.currentValue);
      const total = remaining != null && current != null ? remaining + current : null;
      let leftPercent = null;
      if (total != null && total > 0 && remaining != null) {
        leftPercent = Math.round((remaining / total) * 100);
      } else {
        const used = num(l.percentage);
        if (used != null) leftPercent = 100 - used;
      }
      if (leftPercent == null) return null;
      return {
        leftPercent: Math.max(0, Math.min(100, leftPercent)),
        resetMs: num(l.nextResetTime),
      };
    };

    const fiveHour = tokenLimits.find((l) => l?.number === 5) ?? tokenLimits[0];
    const week = tokenLimits.find((l) => l !== fiveHour);
    const quotas = [];
    const q5 = fiveHour ? toQuota(fiveHour) : null;
    if (q5) quotas.push({ ...q5, kind: "5h" });
    const qw = week ? toQuota(week) : null;
    if (qw) quotas.push({ ...qw, kind: "week" });
    return { level: r.json.data?.level || "", quotas };
  };
}
