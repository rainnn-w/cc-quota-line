import { COMMANDS } from "./registry.js";

const SIDE_EFFECT_LABEL = {
  read: "只读",
  write: "写配置",
  mutating: "改 settings.json",
  "read/write": "读/写配置",
};

export function renderHelp(version) {
  const lines = [];
  lines.push(`cc-quota-line v${version} — Claude Code 多 Provider 余量状态栏`);
  lines.push("");
  lines.push("用法:cc-quota-line [command] [flags]");
  lines.push("");
  lines.push("命令:");
  for (const c of COMMANDS) {
    const args = c.args ? ` ${c.args}` : "";
    lines.push(`  ${c.name}${args}`);
    lines.push(`    ${c.summary} [${SIDE_EFFECT_LABEL[c.sideEffect] ?? c.sideEffect}]`);
  }
  lines.push("");
  lines.push("配置键(cache-ttl-seconds / fail-backoff-seconds / bar-width / timeout-ms /");
  lines.push("        warn-threshold / low-threshold / theme / debug)用 config set 修改,");
  lines.push("        或运行 configure 交互式配置(实时预览,所见即所得)。");
  return lines.join("\n");
}

export function renderHelpFor(name) {
  const c = COMMANDS.find((x) => x.name === name || name === `-${x.name[0]}` || `-${x.name[0]}` === name);
  if (!c) return `未知命令 "${name}"。运行 cc-quota-line help 查看全部命令。`;
  const args = c.args ? ` ${c.args}` : "";
  return [`cc-quota-line ${c.name}${args}`, `  ${c.summary} [${SIDE_EFFECT_LABEL[c.sideEffect] ?? c.sideEffect}]`].join("\n");
}
