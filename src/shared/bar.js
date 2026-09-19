// █(U+2588 全高块)与 ░(U+2591 全高浅影)等高,避免 ▇(下 7/8 块,顶部缺角)造成的错位
export function bar(percent, width = 10) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((p / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
