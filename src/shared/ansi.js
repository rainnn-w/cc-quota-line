export const RESET = "\x1b[0m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[97m";

export function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\x1b\[[0-9;]*m/g, "");
}
