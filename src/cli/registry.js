// 命令注册表(单一事实源):help 与 commands 均由此派生。
// sideEffect:read 只读 / write 写配置 / mutating 改 settings.json
export const COMMANDS = [
  {
    name: "(default)",
    args: "[--json]",
    sideEffect: "read",
    summary: "有 stdin→状态栏单行;无 stdin(TTY)→终端多行;--json 输出结构化结果",
  },
  {
    name: "install",
    args: "[--force]",
    sideEffect: "mutating",
    summary: "写入 Claude Code settings.json 的 statusLine;自动识别旧 statusline.mjs 安装并迁移",
  },
  { name: "uninstall", args: "", sideEffect: "mutating", summary: "移除托管的 statusLine,恢复备份或删除字段" },
  { name: "version", args: " | -v", sideEffect: "read", summary: "打印版本" },
  { name: "commands", args: "[--json]", sideEffect: "read", summary: "列出全部命令" },
  { name: "help", args: " | -h [command]", sideEffect: "read", summary: "全量帮助;help <command> 聚焦帮助" },
  { name: "config", args: "show | set <key> <value> | unset <key> | reset [--yes]", sideEffect: "read/write", summary: "查看/修改配置(~/.claude/cc-quota-line.json)" },
  { name: "check-update", args: "", sideEffect: "read", summary: "检查 npm registry 更新(本地包则提示当前版本)" },
];

export function findCommand(name) {
  return COMMANDS.find((c) => c.name === name) ?? null;
}

export function renderCommands(json = false) {
  if (json) {
    return JSON.stringify(COMMANDS.map(({ name, args, sideEffect, summary }) => ({ name, args, sideEffect, summary })), null, 2);
  }
  const lines = [];
  for (const c of COMMANDS) {
    const args = c.args ? ` ${c.args}` : "";
    lines.push(`${c.name}${args}  — ${c.summary}`);
  }
  return lines.join("\n");
}
