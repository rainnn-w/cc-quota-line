# Changelog

## Unreleased

- 新增自定义颜色:`theme=custom` + `color-ok` / `color-warn` / `color-danger` / `color-info` 四个配置键,支持 16 命名色、`#RRGGBB` 真彩色、`ansi256:N`;未设置的档位继承 dark 默认;TUI 中 color-* 项仅在 theme=custom 时出现,可循环命名色,或按 `e` 内联输入十六进制色值实时预览。
- 修复主题切换只影响单档颜色:light 主题此前仅把"充足"档换成亮白,warn/danger/model 与 dark 完全相同;现改为每套主题完整配色(ok/warn/danger/info 四档同步切换),模型名与 used 走主题 info 色(此前硬编码青色)。
- 新增 `morandi` 主题:莫兰迪色系(薄荷绿 `#87d9c1` / 雾蓝 `#78c4ff` / 杏粉 `#ffad9d` / 雾紫 `#c1cbff`);`light` 主题重做为浅色背景终端适配(深绿/深橙/深红/深蓝)。
- 修复进度条字符错位:填充字符由 `▇`(U+2587,顶部缺 1/8)改为 `█`(U+2588,与 `░` 等高)。
- 新增 `configure` 命令:交互式配置 TUI,顶部实时预览状态栏效果(额度进度条 + 余额两种形态),所见即所得。交互与预览模式移植自 deluo/glm-quota-line(MIT)。

## 0.1.0

- 首个版本:由单文件 `statusline.mjs` 重构为多模块工程。
- 支持 GLM / MiniMax / new-api / DeepSeek / Moonshot 余量查询(含额度进度条、余额、重置时间)。
- 缓存(TTL + 失败退避)、多主题(dark/light/mono)、`--json` 输出。
- `install` / `uninstall` 托管 statusLine 配置,自动识别旧 `statusline.mjs` 安装并迁移。
- `config show/set/unset/reset` 配置管理(白名单校验、原子写入)。
