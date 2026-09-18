import os from "node:os";
import path from "node:path";

export const CLAUDE_DIR = path.join(os.homedir(), ".claude");
export const CACHE_DIR = path.join(CLAUDE_DIR, "statusline-cache");
export const SETTINGS_PATH = path.join(CLAUDE_DIR, "settings.json");
export const CONFIG_PATH = path.join(CLAUDE_DIR, "cc-quota-line.json");

export const SCHEMA_VERSION = 1;
export const MANAGED_BY = "cc-quota-line";
export const LEGACY_MARKER = "statusline.mjs";

// 配置键白名单:kebab-case(CLI)→ 定义(存储为 camelCase)
export const CONFIG_KEYS = {
  "cache-ttl-seconds": {
    key: "cacheTtlSeconds",
    type: "integer",
    min: 30,
    max: 3600,
    def: 90,
  },
  "fail-backoff-seconds": {
    key: "failBackoffSeconds",
    type: "integer",
    min: 10,
    max: 600,
    def: 60,
  },
  "bar-width": { key: "barWidth", type: "integer", min: 4, max: 40, def: 10 },
  "timeout-ms": { key: "timeoutMs", type: "integer", min: 1000, max: 30000, def: 4000 },
  "warn-threshold": { key: "warnThreshold", type: "integer", min: 0, max: 100, def: 20 },
  "low-threshold": { key: "lowThreshold", type: "integer", min: 0, max: 100, def: 60 },
  theme: { key: "theme", type: "enum", values: ["dark", "light", "mono"], def: "dark" },
  debug: { key: "debug", type: "boolean", def: false },
};

export const DEFAULT_CONFIG = {
  schemaVersion: SCHEMA_VERSION,
  managedBy: MANAGED_BY,
  ...Object.fromEntries(Object.values(CONFIG_KEYS).map((d) => [d.key, d.def])),
};

// 禁止通过 config set/unset 动的键
export const READONLY_KEYS = new Set(["schemaversion", "managedby", "install"]);

export function defaultsFor() {
  return structuredClone(DEFAULT_CONFIG);
}
