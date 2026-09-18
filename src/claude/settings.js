import fs from "node:fs";
import { atomicWriteJson, readJson } from "../shared/jsonFile.js";

// env 覆盖顺序:CC_QUOTA_* / STATUSLINE_*(调试)→ settings.json → process.env
export function loadClaudeEnv({
  settingsPath,
  fs: fsi = fs,
  env = process.env,
} = {}) {
  const sources = [];
  if (env.CC_QUOTA_BASE_URL) {
    sources.push({
      ANTHROPIC_BASE_URL: env.CC_QUOTA_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: env.CC_QUOTA_TOKEN || "",
    });
  } else if (env.STATUSLINE_BASE_URL) {
    sources.push({
      ANTHROPIC_BASE_URL: env.STATUSLINE_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: env.STATUSLINE_TOKEN || "",
    });
  }
  const s = readJson(settingsPath, { fs: fsi });
  if (s?.env) sources.push(s.env);
  sources.push(env);

  const pick = (k) => {
    for (const src of sources) if (src?.[k]) return src[k];
    return "";
  };
  return {
    baseUrl: pick("ANTHROPIC_BASE_URL"),
    token: pick("ANTHROPIC_AUTH_TOKEN"),
  };
}

export function readSettings(settingsPath, { fs: fsi = fs } = {}) {
  return readJson(settingsPath, { fs: fsi }) ?? {};
}

export function writeSettings(settingsPath, settings, { fs: fsi = fs } = {}) {
  atomicWriteJson(settingsPath, settings, { fs: fsi });
}
