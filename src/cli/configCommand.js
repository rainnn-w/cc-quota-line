import { loadConfig, resetConfig, setConfigValue, unsetConfigValue } from "../shared/config.js";
import { CONFIG_KEYS } from "../shared/constants.js";

// config show/set/unset/reset;返回要打印的文本(以 "错误" 开头表示失败)
export function runConfigCommand({ sub = [], configPath, flags = {} }) {
  const [cmd, key, value] = sub;

  if (!cmd || cmd === "show") {
    const cfg = loadConfig(configPath);
    const lines = [];
    for (const def of Object.values(CONFIG_KEYS)) {
      lines.push(`${def.key.padEnd(22)} ${cfg[def.key]}`);
    }
    lines.push(`schemaVersion${" ".repeat(10)} ${cfg.schemaVersion}`);
    return lines.join("\n") + "\n";
  }

  if (cmd === "set") {
    if (!key || value === undefined) {
      return `错误:config set 需要 <key> <value>。可用键:${Object.keys(CONFIG_KEYS).join(", ")}\n`;
    }
    const r = setConfigValue(configPath, key, value);
    if (r.error) return `错误:${r.error}\n`;
    return `${r.key} = ${r.value}\n`;
  }

  if (cmd === "unset") {
    if (!key) return `错误:config unset 需要 <key>。可用键:${Object.keys(CONFIG_KEYS).join(", ")}\n`;
    const r = unsetConfigValue(configPath, key);
    if (r.error) return `错误:${r.error}\n`;
    return `${r.key} 已恢复默认值 ${r.value}\n`;
  }

  if (cmd === "reset") {
    if (flags.yes !== true) {
      return "错误:config reset 需要显式确认:cc-quota-line config reset --yes\n";
    }
    resetConfig(configPath);
    return "配置已重置为默认值(install 信息保留)\n";
  }

  return `错误:未知子命令 "${cmd}"。可用:show / set / unset / reset\n`;
}
