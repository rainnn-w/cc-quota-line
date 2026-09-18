import { CONFIG_KEYS, DEFAULT_CONFIG, READONLY_KEYS } from "./constants.js";
import { atomicWriteJson, readJson } from "./jsonFile.js";

// 加载配置:未知键丢弃,非法值回落默认,与默认值合并。
export function loadConfig(configPath, { readJsonFn = readJson } = {}) {
  const raw = readJsonFn(configPath) ?? {};
  const out = {};
  for (const def of Object.values(CONFIG_KEYS)) {
    const v = raw[def.key];
    out[def.key] = validateValue(def, v);
  }
  out.schemaVersion = DEFAULT_CONFIG.schemaVersion;
  out.managedBy = DEFAULT_CONFIG.managedBy;
  out.install = raw.install && typeof raw.install === "object" ? raw.install : {};
  return out;
}

export function validateValue(def, v) {
  if (v === undefined || v === null) return def.def;
  if (def.type === "integer") {
    const n = typeof v === "string" ? parseInt(v, 10) : v;
    if (typeof n !== "number" || !Number.isFinite(n) || n < def.min || n > def.max) return def.def;
    return Math.round(n);
  }
  if (def.type === "boolean") {
    if (typeof v === "boolean") return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return def.def;
  }
  if (def.type === "enum") {
    return def.values.includes(v) ? v : def.def;
  }
  return def.def;
}

// 解析 CLI kebab-case 键;返回 { def } 或 { error }
export function resolveConfigKey(cliKey) {
  if (READONLY_KEYS.has(cliKey.toLowerCase())) {
    return { error: `键 "${cliKey}" 为只读(由工具维护)` };
  }
  const def = CONFIG_KEYS[cliKey];
  if (!def) {
    return { error: `未知键 "${cliKey}"。可用键:${Object.keys(CONFIG_KEYS).join(", ")}` };
  }
  return { def };
}

export function setConfigValue(configPath, cliKey, value, io = {}) {
  const r = resolveConfigKey(cliKey);
  if (r.error) return { error: r.error };
  const def = r.def;
  const parsed = validateValue(def, value);
  if (def.type === "integer") {
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    if (!Number.isFinite(n) || n < def.min || n > def.max) {
      return { error: `键 "${cliKey}" 需要整数(${def.min}-${def.max})` };
    }
  }
  const cfg = loadConfig(configPath, io);
  cfg[def.key] = parsed;
  saveConfig(configPath, cfg, io);
  return { ok: true, key: cliKey, value: parsed };
}

export function unsetConfigValue(configPath, cliKey, io = {}) {
  const r = resolveConfigKey(cliKey);
  if (r.error) return { error: r.error };
  const cfg = loadConfig(configPath, io);
  cfg[r.def.key] = r.def.def;
  saveConfig(configPath, cfg, io);
  return { ok: true, key: cliKey, value: r.def.def };
}

export function resetConfig(configPath, io = {}) {
  const old = loadConfig(configPath, io);
  const cfg = loadConfig(null, { readJsonFn: () => null });
  cfg.install = old.install ?? {};
  saveConfig(configPath, cfg, io);
  return { ok: true };
}

export function saveConfig(configPath, cfg, io = {}) {
  const { atomicWriteJsonFn = atomicWriteJson } = io;
  atomicWriteJsonFn(configPath, cfg);
}
