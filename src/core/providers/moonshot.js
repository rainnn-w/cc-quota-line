import { num } from "../../shared/utils.js";

export function makeMoonshot(fetchJson) {
  return async function queryMoonshot(env) {
    const r = await fetchJson("https://api.moonshot.ai/v1/users/me/balance", {
      Authorization: `Bearer ${env.token}`,
    });
    const left = num(r.json?.data?.available_balance);
    if (left == null) return null;
    return { money: { left, currency: "¥", limit: null } };
  };
}
