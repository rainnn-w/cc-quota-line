// host → provider 分类(沿用 statusline.mjs 原逻辑)
export function classify(baseUrl) {
  let host = "";
  try {
    host = new URL(baseUrl).host.toLowerCase();
  } catch {}
  if (!host) return { key: "official", label: "Claude" };

  const has = (...suffixes) => suffixes.some((s) => host === s || host.endsWith("." + s));
  if (has("bigmodel.cn", "z.ai")) return { key: "glm", label: "GLM" };
  if (has("minimaxi.com", "minimax.io", "minimax.chat", "minimaxi.live")) return { key: "minimax", label: "MiniMax" };
  if (has("xiaomimimo.com")) return { key: "mimo", label: "MiMo" };
  if (has("moonshot.ai", "moonshot.cn", "kimi.com")) return { key: "moonshot", label: "Kimi" };
  if (has("deepseek.com")) return { key: "deepseek", label: "DeepSeek" };
  if (has("anthropic.com")) return { key: "official", label: "Claude" };

  // 其余一律按 new-api / one-api 系中转站尝试 billing 接口,标签取主域名段
  const segs = host.replace(/^www\./, "").split(".");
  const label = segs.length >= 2 ? segs[segs.length - 2] : segs[0];
  return { key: "newapi", label, host };
}
