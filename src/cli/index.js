#!/usr/bin/env node
// cc-quota-line CLI 入口
import { createRequire } from "node:module";
import { parseArgs } from "./args.js";
import { makeCommands } from "./commands.js";
import { DIM, RESET } from "../shared/ansi.js";
import { fileURLToPath } from "node:url";

function readVersion() {
  try {
    const require = createRequire(import.meta.url);
    return require("../../package.json").version;
  } catch {
    return "0.0.0";
  }
}

const version = readVersion();

async function main() {
  const argv = process.argv.slice(2);
  const { flags, _ } = parseArgs(argv);

  let name = _[0] ?? "default";
  if (name === "-v" || name === "--version") name = "version";
  if (name === "-h" || name === "--help") name = "help";
  // config 的子命令透传
  const rest = name === "config" ? _.slice(1) : _;

  const commands = makeCommands(version, {
    scriptPath: fileURLToPath(import.meta.url),
  });
  const handler = commands[name];
  if (!handler) {
    process.stdout.write(`未知命令 "${name}"。运行 cc-quota-line help 查看全部命令。\n`);
    process.exitCode = 1;
    return;
  }
  await handler({ flags, _: name === "help" ? argv : rest });
}

main().catch(() => {
  // 顶层兜底:任何意外错误输出无害占位符,避免状态栏报错
  process.stdout.write(`${DIM}statusline err${RESET}`);
});
