import fs from "node:fs";
import { LEGACY_MARKER, MANAGED_BY } from "../shared/constants.js";
import { atomicWriteJson } from "../shared/jsonFile.js";
import { readJson } from "../shared/jsonFile.js";
import { readSettings, writeSettings } from "./settings.js";

// 构建 statusLine command:node 路径与脚本路径反斜杠归一为 /,带引号
export function buildCommand({ execPath = process.execPath, scriptPath } = {}) {
  const q = (p) => `"${String(p).replace(/\\/g, "/")}"`;
  return `${q(execPath)} ${q(scriptPath)}`;
}

// 判定 statusLine 现状
// - missing:字段不存在
// - managed:command 含 cc-quota-line(自家新安装)
// - legacy:command 含 statusline.mjs(自家旧单文件脚本)
// - unmanaged:其他
export function classifyStatusLine(existing) {
  if (!existing || typeof existing !== "object") return "missing";
  const cmd = typeof existing.command === "string" ? existing.command : JSON.stringify(existing);
  if (cmd.includes("cc-quota-line") || existing.managedBy === MANAGED_BY) return "managed";
  if (cmd.includes(LEGACY_MARKER)) return "legacy";
  return "unmanaged";
}

function makeStatusLine(command) {
  return { type: "command", command, managedBy: MANAGED_BY, padding: 0 };
}

// install 状态机。opts:{ settingsPath, configPath, execPath, scriptPath, force, fs }
// 返回 { status, message };status ∈ installed / updated / migrated / unmanaged_exists / backed_up_then_installed
export function install({ settingsPath, configPath, scriptPath, execPath = process.execPath, force = false, fs: fsi = fs } = {}) {
  const settings = readJson(settingsPath, { fs: fsi }) ?? {};
  const existing = settings.statusLine;
  const state = classifyStatusLine(existing);
  const command = buildCommand({ execPath, scriptPath });

  if (state === "unmanaged") {
    if (!force) {
      return {
        status: "unmanaged_exists",
        message: "statusLine 已被其他程序占用;确认覆盖请加 --force(原值将备份到 install.previousStatusLine)",
      };
    }
    // 备份到 install.previousStatusLine 后替换
    const cfg = readJson(configPath, { fs: fsi }) ?? {};
    cfg.install = {
      ...(cfg.install ?? {}),
      previousStatusLine: existing,
      settingsPath,
      command,
      installed: true,
    };
    writeConfigRaw(configPath, cfg, fsi);
    settings.statusLine = makeStatusLine(command);
    writeSettings(settingsPath, settings, { fs: fsi });
    return { status: "backed_up_then_installed", message: "已备份原 statusLine 并安装" };
  }

  // missing / managed / legacy:直接写入或原地更新
  settings.statusLine = makeStatusLine(command);
  writeSettings(settingsPath, settings, { fs: fsi });
  const cfg = readJson(configPath, { fs: fsi }) ?? {};
  cfg.install = { ...(cfg.install ?? {}), settingsPath, command, installed: true };
  delete cfg.install?.previousStatusLine;
  writeConfigRaw(configPath, cfg, fsi);
  const msg =
    state === "missing" ? "已安装 statusLine"
    : state === "legacy" ? "已从旧 statusline.mjs 迁移"
    : "已更新 statusLine";
  return { status: state === "missing" ? "installed" : state === "legacy" ? "migrated" : "updated", message: msg };
}

// uninstall 状态机。
// 返回 status ∈ restored / removed / unmanaged / missing
export function uninstall({ settingsPath, configPath, fs: fsi = fs } = {}) {
  const settings = readJson(settingsPath, { fs: fsi }) ?? {};
  const existing = settings.statusLine;
  const state = classifyStatusLine(existing);

  if (state === "missing") return { status: "missing", message: "statusLine 不存在,无需卸载" };
  if (state === "unmanaged") {
    return { status: "unmanaged", message: "statusLine 非本工具管理,未改动" };
  }

  const cfg = readJson(configPath, { fs: fsi }) ?? {};
  const backup = cfg.install?.previousStatusLine;
  if (backup && typeof backup === "object") {
    settings.statusLine = backup;
    writeSettings(settingsPath, settings, { fs: fsi });
  } else {
    delete settings.statusLine;
    writeSettings(settingsPath, settings, { fs: fsi });
  }
  const next = { ...cfg, install: {} };
  writeConfigRaw(configPath, next, fsi);
  return {
    status: backup ? "restored" : "removed",
    message: backup ? "已恢复安装前的 statusLine" : "已移除 statusLine",
  };
}

function writeConfigRaw(configPath, cfg, fsi) {
  atomicWriteJson(configPath, cfg, { fs: fsi });
}
