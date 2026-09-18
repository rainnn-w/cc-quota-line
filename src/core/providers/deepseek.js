import { num } from "../../shared/utils.js";

export function makeDeepseek(fetchJson) {
  return async function queryDeepseek(env) {
    const r = await fetchJson("https://api.deepseek.com/user/balance", {
      Authorization: `Bearer ${env.token}`,
    });
    const infos = Array.isArray(r.json?.balance_infos) ? r.json.balance_infos : [];
    const cny = infos.find((b) => b.currency === "CNY") ?? infos[0];
    const left = num(cny?.total_balance);
    if (left == null) return null;
    return { money: { left, currency: "¥", limit: null } };
  };
}
