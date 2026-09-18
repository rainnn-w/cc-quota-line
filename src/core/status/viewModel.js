import { fmtResetTime } from "../../shared/utils.js";

// 查询结果 → 视图模型(label、quota 段列表或 money 段、model 名)
export function buildViewModel({ input, provider, data }) {
  const modelName = input?.model?.display_name || input?.model?.id || "";
  const level = data?.level
    ? data.level.charAt(0).toUpperCase() + data.level.slice(1).toLowerCase()
    : "";
  const label = provider.label + (level ? ` ${level}` : "");

  let section = { type: "hint", hint: provider.key === "official" ? "run /usage" : "quota n/a" };
  if (data?.quotas?.length) {
    section = {
      type: "quotas",
      quotas: data.quotas.map((q) => ({
        leftPercent: q.leftPercent,
        week: q.kind === "week",
        reset: fmtResetTime(q.resetMs),
      })),
    };
  } else if (data?.money) {
    section = { type: "money", money: data.money };
  } else if (data?.used != null) {
    section = { type: "used", used: data.used };
  }

  return { label, section, modelName };
}
