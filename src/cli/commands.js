import { CONFIG_PATH, SETTINGS_PATH } from "../shared/constants.js";
import { loadConfig } from "../shared/config.js";
import { readStdinJson } from "../claude/input.js";
import { loadClaudeEnv } from "../claude/settings.js";
import { install, uninstall } from "../claude/install.js";
import { queryQuota } from "../core/quota.js";
import { buildViewModel } from "../core/status/viewModel.js";
import { renderBlock, renderJson, renderLine } from "../core/status/format.js";
import { runConfigCommand } from "./configCommand.js";
import { runTUI } from "../tui/index.js";
import { checkUpdate } from "./update.js";
import { renderHelp, renderHelpFor } from "./help.js";
import { renderCommands } from "./registry.js";
import { fileURLToPath } from "node:url";

export function makeCommands(version, { scriptPath } = {}) {
  return {
    async default({ flags }) {
      const config = loadConfig(CONFIG_PATH);
      const [input, env] = await Promise.all([
        readStdinJson(),
        Promise.resolve(loadClaudeEnv({ settingsPath: SETTINGS_PATH })),
      ]);
      const { provider, data, fetchedAt } = await queryQuota({ ...env, config });
      const vm = buildViewModel({ input, provider, data });
      if (flags.json) {
        process.stdout.write(renderJson({ provider, data, fetchedAt, input }) + "\n");
        return;
      }
      process.stdout.write(input ? renderLine(vm, config) : renderBlock(vm, config) + "\n");
    },

    install({ flags }) {
      const r = install({
        settingsPath: SETTINGS_PATH,
        configPath: CONFIG_PATH,
        scriptPath: scriptPath ?? fileURLToPath(new URL("./index.js", import.meta.url)),
        force: flags.force === true,
      });
      process.stdout.write(r.message + "\n");
      if (r.status === "unmanaged_exists") process.exitCode = 1;
    },

    uninstall() {
      const r = uninstall({ settingsPath: SETTINGS_PATH, configPath: CONFIG_PATH });
      process.stdout.write(r.message + "\n");
    },

    version() {
      process.stdout.write(version + "\n");
    },

    commands({ flags }) {
      process.stdout.write(renderCommands(flags.json === true) + "\n");
    },

    help({ _ }) {
      const topic = _.find((a) => !a.startsWith("-") && a !== "help" && a !== "-h");
      process.stdout.write((topic ? renderHelpFor(topic) : renderHelp(version)) + "\n");
    },

    config({ _, flags }) {
      const out = runConfigCommand({ sub: _, configPath: CONFIG_PATH, flags });
      process.stdout.write(out);
      if (out.startsWith("错误")) process.exitCode = 1;
    },

    async configure() {
      await runTUI({ configPath: CONFIG_PATH });
    },

    "check-update": async () => {
      const out = await checkUpdate(version);
      process.stdout.write(out + "\n");
    },
  };
}
