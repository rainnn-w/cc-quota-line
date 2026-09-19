// 交互式配置 TUI:交互与预览模式移植自 deluo/glm-quota-line(MIT),
// 配置项适配本项目的扁平键值模型(单一事实源 CONFIG_KEYS)。
// 预览直接走 buildViewModel + renderLine 真实渲染路径,所见即所得。
import readline from "node:readline";
import { CONFIG_KEYS, CONFIG_PATH } from "../shared/constants.js";
import { loadConfig, saveConfig } from "../shared/config.js";
import { RESET, BLUE, GRAY, WHITE, BOLD, TUI_COLORS, getTuiColors } from "../shared/ansi.js";
import { buildViewModel } from "../core/status/viewModel.js";
import { renderLine } from "../core/status/format.js";
import { DEMO_QUOTA, DEMO_MONEY } from "./utils/demoData.js";

// TUI 展示顺序与调整步长;preview 标记影响预览效果的键。
const ITEMS = [
  { kebab: "theme", step: null, preview: true },
  { kebab: "bar-width", step: 1, preview: true },
  { kebab: "warn-threshold", step: 5, preview: true },
  { kebab: "low-threshold", step: 5, preview: true },
  { kebab: "cache-ttl-seconds", step: 30, preview: false },
  { kebab: "fail-backoff-seconds", step: 10, preview: false },
  { kebab: "timeout-ms", step: 500, preview: false },
  { kebab: "debug", step: null, preview: false },
].map((it) => ({ ...it, ...CONFIG_KEYS[it.kebab] }));

function fmtValue(item, v) {
  if (item.type === "boolean") return v ? "true" : "false";
  return String(v);
}

function cycleValue(item, v) {
  if (item.type === "enum") return item.values[(item.values.indexOf(v) + 1) % item.values.length];
  if (item.type === "boolean") return !v;
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

export function render(config, index, message) {
  const lines = [];
  const colors = getTuiColors(config.theme);
  const rule = `${GRAY}┌─────────────────────────────────────────────────────┐${RESET}`;

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

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
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

  if (message) {
    const color = message.color === "green" ? colors.success : colors.error;
    lines.push("");
    lines.push(`  ${color}${message.text}${RESET}`);
  }

  lines.push("");
  lines.push(
    `  ${colors.title}[↑/↓]${RESET} 选择  ${colors.title}[Space/→]${RESET} 调整  ${colors.title}[←]${RESET} 减  ${colors.title}[r]${RESET} 恢复默认  ${colors.enabled}[s]${RESET} 保存  ${colors.error}[q]${RESET} 退出`
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

  function draw() {
    process.stdout.write(render(config, index, message));
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

    process.stdin.on("keypress", function onKey(str, key) {
      message = null;

      if (key.ctrl && key.name === "c") {
        cleanup();
        if (dirty) process.stdout.write(TUI_COLORS.clearScreen + "  已退出(未保存)。\n");
        resolve();
        return;
      }

      if (key.name === "q") {
        cleanup();
        if (dirty) process.stdout.write(TUI_COLORS.clearScreen + "  已退出(未保存)。\n");
        resolve();
        return;
      }

      if (key.name === "escape") return;

      if (key.name === "up") {
        index = Math.max(0, index - 1);
        draw();
        return;
      }
      if (key.name === "down") {
        index = Math.min(ITEMS.length - 1, index + 1);
        draw();
        return;
      }

      const item = ITEMS[index];

      if (key.name === "r") {
        if (config[item.key] !== item.def) {
          config[item.key] = item.def;
          dirty = true;
        }
        draw();
        return;
      }

      if (key.name === "s") {
        saveTUIConfig(config, configPath);
        message = { text: "配置已保存!", color: "green" };
        dirty = false;
        draw();
        setTimeout(() => {
          cleanup();
          resolve();
        }, 800);
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
      draw();
    });
  });
}

// 全量保存(loadConfig 出来的对象含 install 信息,与 config set 同路径)。
export function saveTUIConfig(config, configPath = CONFIG_PATH, io = {}) {
  saveConfig(configPath, config, io);
}
