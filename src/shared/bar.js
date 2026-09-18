export function bar(percent, width = 10) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((p / 100) * width);
  return "▇".repeat(filled) + "░".repeat(width - filled);
}
