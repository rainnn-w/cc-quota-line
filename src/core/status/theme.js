import { GREEN, YELLOW, RED, CYAN, WHITE } from "../../shared/ansi.js";

// 颜色分档:阈值读 config(warnThreshold 默认 20 以下红,lowThreshold 默认 60 以下黄)。
// mono 主题全部无色;light 主题用高亮白代替绿。
export function makeTheme(config = {}) {
  const theme = config.theme ?? "dark";
  const warn = config.warnThreshold ?? 20;
  const low = config.lowThreshold ?? 60;
  const okColor = theme === "light" ? WHITE : GREEN;
  return {
    name: theme,
    mono: theme === "mono",
    colorFor(leftPercent) {
      if (!Number.isFinite(leftPercent)) return CYAN;
      if (this.mono) return "";
      if (leftPercent >= low) return okColor;
      if (leftPercent >= warn) return YELLOW;
      return RED;
    },
    moneyColor(left, limit) {
      if (this.mono) return "";
      if (left <= 0) return RED;
      if (left < Math.min(limit ?? 5, 5)) return YELLOW;
      return okColor;
    },
    info: theme === "mono" ? "" : CYAN,
    bold: theme === "mono" ? "" : "\x1b[1m",
    dim: theme === "mono" ? "" : "\x1b[2m",
    reset: theme === "mono" ? "" : "\x1b[0m",
  };
}
