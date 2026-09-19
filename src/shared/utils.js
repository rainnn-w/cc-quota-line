import crypto from "node:crypto";

export function num(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export function fmtResetTime(ms, nowFn = Date.now) {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function tokenTag(token) {
  if (!token) return "notoken";
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 8);
}

// 自定义颜色 spec:16 命名色 | #RRGGBB / RRGGBB | ansi256:0-255;解析为前景 ANSI 序列。
export const NAMED_COLORS = {
  black: 30, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37,
  brightBlack: 90, brightRed: 91, brightGreen: 92, brightYellow: 93,
  brightBlue: 94, brightMagenta: 95, brightCyan: 96, brightWhite: 97,
};

export function parseColor(v) {
  if (!v || typeof v !== "string") return null;
  if (NAMED_COLORS[v] != null) return `\x1b[${NAMED_COLORS[v]}m`;
  let m = /^#?([0-9a-fA-F]{6})$/.exec(v);
  if (m) {
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }
  m = /^ansi256:(\d{1,3})$/.exec(v);
  if (m) {
    const n = Number(m[1]);
    if (Number.isInteger(n) && n >= 0 && n <= 255) return `\x1b[38;5;${n}m`;
  }
  return null;
}

export function isValidColor(v) {
  return v === "" || parseColor(v) != null;
}
