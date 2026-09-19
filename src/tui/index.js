// 交互式配置 TUI:交互与预览模式移植自 deluo/glm-quota-line(MIT),
// 配置项适配本项目的扁平键值模型(单一事实源 CONFIG_KEYS)。
// 预览直接走 buildViewModel + renderLine 真实渲染路径,所见即所得。
import readline from "node:readline";
import { CONFIG_KEYS, CONFIG_PATH } from "../shared/constants.js";
import { loadConfig, saveConfig } from "../shared/config.js";
import { NAMED_COLORS } from "../shared/utils.js";
import { RESET, BLUE, GRAY, WHITE, BOLD, TUI_COLORS, getTuiColors } from "../shared/ansi.js";
import { buildViewModel } from "../core/status/viewModel.js";
import { renderLine } from "../core/status/format.js";
import { DEMO_QUOTA, DEMO_MONEY } from "./utils/demoData.js";

// 全量配置项;color-* 四项仅在 theme=custom 时进入可见列表(避免"改了却不生效"的误导)
export const ITEMS = [
  { kebab: "theme", step: null, preview: true },
  { kebab: "color-ok", step: null, preview: true },
  { kebab: "color-warn", step: null, preview: true },
  { kebab: "color-danger", step: null, preview: true },
  { kebab: "color-info", step: null, preview: true },
  { kebab: "bar-width", step: 1, preview: true },
  { kebab: "warn-threshold", step: 5, preview: true },
  { kebab: "low-threshold", step: 5, preview: true },
  { kebab: "cache-ttl-seconds", step: 30, preview: false },
  { kebab: "fail-backoff-seconds", step: 10, preview: false },
  { kebab: "timeout-ms", step: 500, preview: false },
  { kebab: "debug", step: null, preview: false },
].map((it) => ({ ...it, ...CONFIG_KEYS[it.kebab] }));

export function visibleItems(config) {
  const showColors = config.theme === "custom";
  return ITEMS.filter((it) => it.type !== "color" || showColors);
}

function fmtValue(item, v) {
  if (item.type === "boolean") return v ? "true" : "false";
  if (item.type === "color") return v ? String(v) : "(dark 默认)";
  return String(v);
}

function cycleValue(item, v) {
  if (item.type === "enum") return item.values[(item.values.indexOf(v) + 1) % item.values.length];
  if (item.type === "boolean") return !v;
  if (item.type === "color") {
    const seq = ["", ...Object.keys(NAMED_COLORS)];
    return seq[(seq.indexOf(v) + 1) % seq.length];
  }
  return v;
}

function stepValue(item, v, dir) {
  if (item.type !== "integer") return cycleValue(item, v);
  return Math.min(item.max, Math.max(item.min, v + dir * item.step));
}

function renderPreviewLine(demo, config) {
  try {
    const vm = buildViewModel({ input: demo.input, provider: demo.provider, data: demo.data });
    return renderLine(vm, config) || "Preview unavailable";
  } catch {
    return "Preview error";
  }
}

// input:色值内联输入状态 { item, buf };仅 color 项可用([e] 进入)
export function render(config, index, message, input = null) {
  const lines = [];
  const colors = getTuiColors(config.theme);
  const rule = `${GRAY}┌─────────────────────────────────────────────────────┐${RESET}`;
  const items = visibleItems(config);

  lines.push(`  ${BOLD}${colors.title}cc-quota-line Configuration${RESET}`);
  lines.push("");
  lines.push(`  ${colors.title}Preview:${RESET}`);
  for (const demo of [DEMO_QUOTA, DEMO_MONEY]) {
    lines.push(`  ${rule}`);
    lines.push(`  ${GRAY}│${RESET} ${renderPreviewLine(demo, config)}`);
    lines.push(`  ${GRAY}└─────────────────────────────────────────────────────┘${RESET}`);
  }
  lines.push("");
  lines.push(`  ${colors.title}Settings:${RESET}`);
  lines.push("");

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sel = i === index;
    const cursor = sel ? `${BLUE}▸${RESET} ` : "  ";
    const nameColor = sel ? colors.selected : WHITE;
    const valColor = item.preview ? colors.value : colors.disabled;
    const cur = config[item.key];
    const dirtyMark = cur !== item.def ? " *" : "";
    lines.push(
      `  ${cursor}${nameColor}${item.kebab.padEnd(21)}${RESET} ${valColor}${fmtValue(item, cur)}${dirtyMark}${RESET}`
    );
  }

  if (input) {
    lines.push("");
    const pad = "_".repeat(Math.max(0, 6 - input.buf.length));
    lines.push(`  ${BOLD}${input.item.kebab}:${RESET} #${input.buf}${GRAY}${pad}${RESET}`);
    lines.push(`  ${GRAY}[0-9a-f] 输入  [Enter] 应用(留空=恢复默认)  [Esc] 取消${RESET}`);
  } else if (message) {
    const color = message.color === "green" ? colors.success : colors.error;
    lines.push("");
    lines.push(`  ${color}${message.text}${RESET}`);
  }

  const cur = items[index];
  const editHint = !input && cur?.type === "color" ? `  ${colors.title}[e]${RESET} 输入色值` : "";
  lines.push("");
  lines.push(
    `  ${colors.title}[↑/↓]${RESET} 选择  ${colors.title}[Space/→]${RESET} 调整  ${colors.title}[←]${RESET} 减  ${colors.title}[r]${RESET} 恢复默认${editHint}  ${colors.enabled}[s]${RESET} 保存  ${colors.error}[q]${RESET} 退出`
  );
  return TUI_COLORS.clearScreen + TUI_COLORS.hideCursor + lines.join("\n") + "\n";
}

export async function runTUI({ configPath = CONFIG_PATH } = {}) {
  if (!process.stdin.isTTY) {
    process.stdout.write("  configure 命令需要交互式终端。\n");
    return;
  }

  const config = loadConfig(configPath);
  let index = 0;
  let message = null;
  let dirty = false;
  let input = null;

  function clampIndex() {
    const len = visibleItems(config).length;
    if (index >= len) index = len - 1;
  }

  function draw() {
    clampIndex();
    process.stdout.write(render(config, index, message, input));
  }

  draw();

  await new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(TUI_COLORS.showCursor);
    }

    function quit() {
      cleanup();
      if (dirty) process.stdout.write(TUI_COLORS.clearScreen + "  已退出(未保存)。\n");
      resolve();
    }

    function save() {
      saveTUIConfig(config, configPath);
      message = { text: "配置已保存!", color: "green" };
      dirty = false;
      draw();
      setTimeout(() => {
        cleanup();
        resolve();
      }, 800);
    }

    process.stdin.on("keypress", function onKey(str, key) {
      // 色值输入模式:拦截全部按键,除 Ctrl+C
      if (input) {
        if (key.ctrl && key.name === "c") {
          quit();
          return;
        }
        if (key.name === "escape") {
          input = null;
          draw();
          return;
        }
        if (key.name === "return" || str === "\r") {
          const value = input.buf ? `#${input.buf}` : "";
          if (config[input.item.key] !== value) {
            config[input.item.key] = value;
            dirty = true;
          }
          input = null;
          draw();
          return;
        }
        if (key.name === "backspace" || key.name === "delete") {
          input = { ...input, buf: input.buf.slice(0, -1) };
          draw();
          return;
        }
        if (/^[0-9a-fA-F]$/.test(str) && input.buf.length < 6) {
          input = { ...input, buf: input.buf + str.toLowerCase() };
          draw();
        }
        return;
      }

      message = null;

      if ((key.ctrl && key.name === "c") || key.name === "q") {
        quit();
        return;
      }

      if (key.name === "s") {
        save();
        return;
      }

      if (key.name === "escape") return;

      const items = visibleItems(config);

      if (key.name === "up") {
        index = Math.max(0, index - 1);
        draw();
        return;
      }
      if (key.name === "down") {
        index = Math.min(items.length - 1, index + 1);
        draw();
        return;
      }

      const item = items[index];

      if (key.name === "e" && item?.type === "color") {
        const m = /^#?([0-9a-fA-F]{6})$/.exec(config[item.key] ?? "");
        input = { item, buf: m ? m[1].toLowerCase() : "" };
        draw();
        return;
      }

      if (key.name === "r") {
        if (config[item.key] !== item.def) {
          config[item.key] = item.def;
          dirty = true;
        }
        draw();
        return;
      }

      let dir = 0;
      if (key.name === "right" || str === "+" || key.name === "space" || str === " ") dir = 1;
      else if (key.name === "left" || str === "-") dir = -1;
      if (dir === 0) return;

      const next = item.type === "integer" ? stepValue(item, config[item.key], dir) : cycleValue(item, config[item.key]);
      if (next !== config[item.key]) {
        config[item.key] = next;
        dirty = true;
      }
      // theme 切换会改变可见列表(增删 color 项),draw 内会 clamp index
      draw();
    });
  });
}

// 全量保存(loadConfig 出来的对象含 install 信息,与 config set 同路径)。
export function saveTUIConfig(config, configPath = CONFIG_PATH, io = {}) {
  saveConfig(configPath, config, io);
}
