import { RESET as R, DIM, CYAN } from "../../shared/ansi.js";
import { bar } from "../../shared/bar.js";
import { makeTheme } from "./theme.js";

// 状态栏单行(与旧 statusline.mjs 输出格式一致)
export function renderLine(vm, config = {}) {
  const t = makeTheme(config);
  const width = config.barWidth ?? 10;
  const RESET = t.reset;
  const DIMc = t.dim;
  const parts = [];

  parts.push(`${t.bold}${vm.label}${RESET}`);

  const s = vm.section;
  if (s.type === "quotas") {
    for (const q of s.quotas) {
      const col = t.colorFor(q.leftPercent);
      const tag = q.week ? "W " : "";
      const resetStr = q.reset ? ` ${DIMc}↻${q.reset}${RESET}` : "";
      parts.push(`${tag}${col}${bar(q.leftPercent, width)} ${q.leftPercent}%${RESET}${resetStr}`);
    }
  } else if (s.type === "money") {
    const m = s.money;
    const left = m.left >= 100 ? m.left.toFixed(0) : m.left.toFixed(2);
    const col = t.moneyColor(m.left, m.limit);
    const limitStr = m.limit != null ? `${DIMc} left / ${m.currency}${m.limit}${RESET}` : `${DIMc} left${RESET}`;
    parts.push(`${col}${m.currency}${left}${RESET}${limitStr}`);
  } else if (s.type === "used") {
    const u = s.used >= 100 ? s.used.toFixed(0) : s.used.toFixed(2);
    parts.push(`${t.mono ? "" : CYAN}used $${u}${RESET}`);
  } else {
    parts.push(`${DIMc}${s.hint}${RESET}`);
  }

  if (vm.modelName) parts.push(`${t.mono ? "" : CYAN}${vm.modelName}${RESET}`);
  return parts.join(` ${DIMc}·${RESET} `);
}

// 终端多行(TTY 无 stdin 时):label/详情/model 各占一行,带标题
export function renderBlock(vm, config = {}) {
  const line = renderLine(vm, config);
  const t = makeTheme(config);
  const strip = (s) => (t.mono ? s : s);
  const title = `${t.bold}cc-quota-line${t.reset} ${t.dim}(终端模式;管道传入 Claude Code JSON 可渲染模型名)${t.reset}`;
  return [title, strip(line)].join("\n");
}

// --json 输出
export function renderJson({ provider, data, fetchedAt, input }) {
  return JSON.stringify({
    provider: { key: provider.key, label: provider.label },
    model: input?.model?.display_name || input?.model?.id || "",
    data,
    fetchedAt,
  });
}
