# cc-quota-line

![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![deps](https://img.shields.io/badge/dependencies-0-success) ![license](https://img.shields.io/badge/license-MIT-blue)

Claude Code 多 Provider 余量状态栏。根据 `~/.claude/settings.json` 中的 `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN` 识别当前 provider,查询余量并渲染统一格式:

```
GLM ▇▇▇▇▇▇▇░░░ 72% · W ▇▇▇░░░░░░░ 30% · ↻19:19 · glm-5.1
MiniMax ▇▇▇░░░░░░░ 30% · W ▇▇▇▇░░░░░░ 44% · ↻21:05 · MiniMax-M3
sduonline $8.42 left · claude-opus-4-6
```

## 功能

| 能力 | 说明 |
|---|---|
| 多 Provider | GLM(含 z.ai)、MiniMax、new-api/one-api 系中转站、DeepSeek、Moonshot |
| 额度进度条 | 5h / 周双段,颜色分档(阈值可配) |
| 余额显示 | 中转站 / DeepSeek / Moonshot 显示剩余金额 |
| 缓存 | `~/.claude/statusline-cache/`,TTL 90s;失败退避 60s |
| 主题 | dark / light / mono |
| install/uninstall | 托管 `settings.json` 的 `statusLine`,自动迁移旧 `statusline.mjs` |
| 零依赖 | 仅 Node.js ≥ 18 内置能力 |

## 快速开始

```bash
git clone <repo> && cd cc-quota-line
node src/cli/index.js install   # 托管状态栏(旧 statusline.mjs 会自动迁移)
# 重启 Claude Code 生效
```

## 配置项(`~/.claude/cc-quota-line.json`)

| CLI 键 | 默认 | 范围 | 说明 |
|---|---|---|---|
| `cache-ttl-seconds` | 90 | 30-3600 | 成功缓存时长 |
| `fail-backoff-seconds` | 60 | 10-600 | 失败退避时长 |
| `bar-width` | 10 | 4-40 | 进度条宽度 |
| `timeout-ms` | 4000 | 1000-30000 | 请求超时 |
| `warn-threshold` | 20 | 0-100 | 低于此值红色 |
| `low-threshold` | 60 | 0-100 | 低于此值黄色 |
| `theme` | dark | dark/light/mono | 配色 |
| `debug` | false | - | 原始响应输出到 stderr |

```bash
cc-quota-line config set bar-width 14
cc-quota-line config unset bar-width
cc-quota-line config reset --yes
cc-quota-line config show
```

未知键丢弃、非法值回落默认;`schemaVersion` / `managedBy` / `install.*` 为只读。

## 命令参考

| 命令 | sideEffect | 说明 |
|---|---|---|
| (默认) | read | 有 stdin → 状态栏单行;TTY → 终端多行;`--json` 结构化输出 |
| `install [--force]` | mutating | 写 statusLine;非托管配置需 `--force`(备份后替换) |
| `uninstall` | mutating | 恢复备份或删除字段 |
| `version` / `-v` | read | 版本 |
| `commands [--json]` | read | 命令表 |
| `help [command]` / `-h` | read | 帮助 |
| `config show/set/unset/reset` | read/write | 配置管理 |
| `check-update` | read | npm registry 检查(本地包提示当前版本) |

## 给 Agent 的约定

- 依赖方向:`cli → claude + core → shared`,禁止反向/横向 import。
- 全部外部依赖注入:`fetchJson` / `fs` / `now` / 路径均可替换,`node --test` 零 devDependencies。
- 顶层异常兜底输出 dim `statusline err`,状态栏永不报错。
- 配置写入必走原子写(`.tmp-{pid}` + rename)。

## License

MIT
