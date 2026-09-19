export const RESET = "\x1b[0m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[97m";
export const BLUE = "\x1b[34m";
export const GRAY = "\x1b[90m";

// TUI 专用:光标与清屏控制(源自 deluo/glm-quota-line,MIT)
export const TUI_COLORS = {
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  clearScreen: "\x1b[2J\x1b[H",
};

const COLOR_PALETTE = {
  title: CYAN,
  selected: BOLD + BLUE,
  value: GREEN,
  enabled: GREEN,
  disabled: GRAY,
  success: GREEN,
  error: RED,
};

const MONO_PALETTE = {
  title: BOLD,
  selected: BOLD,
  value: BOLD,
  enabled: BOLD,
  disabled: DIM,
  success: BOLD,
  error: BOLD,
};

export function getTuiColors(theme = "dark") {
  return theme === "mono" ? MONO_PALETTE : COLOR_PALETTE;
}

export function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\x1b\[[0-9;]*m/g, "");
}
