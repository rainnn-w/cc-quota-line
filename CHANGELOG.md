# Changelog

## Unreleased

- 新增 `configure` 命令:交互式配置 TUI,顶部实时预览状态栏效果(额度进度条 + 余额两种形态),所见即所得。交互与预览模式移植自 deluo/glm-quota-line(MIT)。

## 0.1.0

- 首个版本:由单文件 `statusline.mjs` 重构为多模块工程。
- 支持 GLM / MiniMax / new-api / DeepSeek / Moonshot 余量查询(含额度进度条、余额、重置时间)。
- 缓存(TTL + 失败退避)、多主题(dark/light/mono)、`--json` 输出。
- `install` / `uninstall` 托管 statusLine 配置,自动识别旧 `statusline.mjs` 安装并迁移。
- `config show/set/unset/reset` 配置管理(白名单校验、原子写入)。
