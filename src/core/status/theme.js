import { parseColor } from "../../shared/utils.js";

// 主题色表:每套主题是完整配色(ok/warn/danger/info 四档),切换主题时全部生效。
// dark   = 标准色系(默认,保持原始观感)
// light  = 浅色背景终端适配
// morandi = 莫兰迪色系(薄荷绿 #87d9c1 / 雾蓝 #78c4ff / 杏粉 #ffad9d / 雾紫 #c1cbff,深浅背景均可)
// custom = 用户自定义四档(color-ok/warn/danger/info 配置键,空档继承 dark)
const THEMES = {
  dark: {
    ok:     parseColor("#3FB950"), // 柔和绿，不刺眼
    warn:   parseColor("#ffdb83"), 
    danger: parseColor("#ff4a6c"), 
    info:   parseColor("#58A6FF"), // 天空蓝
  },
  light: {
    ok:     parseColor("#3fb950"), // 深绿，白底对比度达标
    warn:   parseColor("#ff7e1e"),
    danger: parseColor("#CF222E"), // 深红
    info:   parseColor("#0969DA"), // 深蓝
  },
  morandi: {
    ok: parseColor("#87d9c1"),
    warn: parseColor("#78c4ff"),
    danger: parseColor("#ffad9d"),
    info: parseColor("#a6b4fc"),
  },
};

function resolveThemeColors(config) {
  const theme = config.theme ?? "dark";
  if (theme !== "custom") return THEMES[theme] ?? THEMES.dark;
  const pick = (v, fallback) => parseColor(v) ?? fallback;
  return {
    ok: pick(config.colorOk, THEMES.dark.ok),
    warn: pick(config.colorWarn, THEMES.dark.warn),
    danger: pick(config.colorDanger, THEMES.dark.danger),
    info: pick(config.colorInfo, THEMES.dark.info),
  };
}

// 颜色分档:阈值读 config(warnThreshold 默认 20 以下红,lowThreshold 默认 60 以下黄)。
// mono 主题全部无色。
export function makeTheme(config = {}) {
  const theme = config.theme ?? "dark";
  const warn = config.warnThreshold ?? 20;
  const low = config.lowThreshold ?? 60;
  const c = resolveThemeColors(config);
  const mono = theme === "mono";
  return {
    name: theme,
    mono,
    colorFor(leftPercent) {
      if (!Number.isFinite(leftPercent)) return mono ? "" : c.info;
      if (mono) return "";
      if (leftPercent >= low) return c.ok;
      if (leftPercent >= warn) return c.warn;
      return c.danger;
    },
    moneyColor(left, limit) {
      if (mono) return "";
      if (left <= 0) return c.danger;
      if (left < Math.min(limit ?? 5, 5)) return c.warn;
      return c.ok;
    },
    info: mono ? "" : c.info,
    bold: mono ? "" : "\x1b[1m",
    dim: mono ? "" : "\x1b[2m",
    reset: mono ? "" : "\x1b[0m",
  };
}
