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
