# cc-quota-line

![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![deps](https://img.shields.io/badge/dependencies-0-success) ![license](https://img.shields.io/badge/license-MIT-blue)

让你的 Claude Code 状态栏**实时显示 API 余量**。

在用 GLM、MiniMax、Kimi、DeepSeek 或各种 new-api 中转站跑 Claude Code?额度什么时候用完、什么时候重置,总得切网页去查。装上 cc-quota-line,余量直接躺在状态栏里,一眼可见:

```
GLM ▇▇▇▇▇▇▇░░░ 72% · W ▇▇▇░░░░░░░ 30% · ↻19:19 · glm-5.1
MiniMax ▇▇▇░░░░░░░ 30% · W ▇▇▇▇░░░░░░ 44% · ↻21:05 · MiniMax-M3
```

中转站按余额计费?显示剩余金额:

```
sduonline · $8.42 left / $10 · claude-opus-4-6
```

零依赖、零配置——装完即用,自动识别你当前的 Provider。

## 它能做什么

- **自动识别 Provider**:读取 `~/.claude/settings.json` 里的 `ANTHROPIC_BASE_URL`,你用 cc-switch 或手动切到哪家,状态栏就查哪家
- **额度进度条**:5 小时窗口 + 周额度双段显示,余量越少颜色越警示(绿 → 黄 → 红)
- **重置时间**:`↻19:19` 告诉你额度几点恢复
- **余额显示**:按金额计费的站点直接显示剩余金额
- **智能缓存**:结果缓存 90 秒,状态栏刷新不狂打 API;查询失败自动退避
- **安全托管**:install / uninstall 一条命令接管 `settings.json` 的 statusLine,不动你其他配置,随时还原
- **零依赖**:只要 Node.js ≥ 18,不装任何 npm 包

## 安装

需要 Node.js ≥ 18:

```bash
npm install -g cc-quota-line
cc-quota-line install   # 接管状态栏
```

重启 Claude Code,状态栏就会出现余量信息。

也可以直接从源码安装:

```bash
git clone https://github.com/rainnn-w/cc-quota-line.git
cd cc-quota-line
npm link
cc-quota-line install
```

> 如果状态栏已配置过其他脚本,install 会拒绝并提示;确认覆盖请用 `cc-quota-line install --force`,原配置会自动备份,uninstall 时还原。

## 支持的 Provider

| Provider | 域名 | 显示内容 |
|---|---|---|
| GLM(智谱) | `bigmodel.cn` / `z.ai` | 5h + 周额度进度条、重置时间、等级 |
| MiniMax | `minimaxi.com` / `minimax.io` 等 | 5h + 周额度进度条、重置时间 |
| Kimi (Moonshot) | `moonshot.ai` / `moonshot.cn` / `kimi.com` | 剩余余额(¥) |
| DeepSeek | `deepseek.com` | 剩余余额(¥) |
| new-api / one-api 系中转站 | 其余全部自动按中转站尝试 | 剩余金额($,不限量站点显示已用量) |
| Claude 官方 | `anthropic.com` | 提示 `run /usage`(官方无公开余量接口) |

## 日常使用

通常装完就不用管了。偶尔用到的命令:

```bash
cc-quota-line                          # 手动看一次(TTY 下多行展示)
echo '{"model":{"display_name":"X"}}' | cc-quota-line --json   # 结构化输出
cc-quota-line uninstall               # 卸载,还原 statusLine
cc-quota-line help                    # 全部命令
```

## 自定义配置

配置存在 `~/.claude/cc-quota-line.json`,推荐用命令改(带校验、原子写入):

```bash
cc-quota-line config set bar-width 14      # 进度条加宽
cc-quota-line config set theme mono        # 纯文本,无颜色
cc-quota-line config set cache-ttl-seconds 300   # 缓存 5 分钟
cc-quota-line config show                  # 查看当前全部配置
cc-quota-line config unset bar-width       # 恢复单项默认
cc-quota-line config reset --yes           # 全部恢复默认
```

| 配置键 | 默认 | 取值范围 | 说明 |
|---|---|---|---|
| `cache-ttl-seconds` | 90 | 30 - 3600 | 查询成功后的缓存时长 |
| `fail-backoff-seconds` | 60 | 10 - 600 | 查询失败后的重试间隔 |
| `bar-width` | 10 | 4 - 40 | 进度条宽度 |
| `timeout-ms` | 4000 | 1000 - 30000 | 接口请求超时 |
| `warn-threshold` | 20 | 0 - 100 | 余量低于此值变红(%) |
| `low-threshold` | 60 | 0 - 100 | 余量低于此值变黄(%) |
| `theme` | dark | dark / light / mono | 配色主题 |
| `debug` | false | true / false | 把接口原始响应打到 stderr 排查问题 |

## 常见问题

**状态栏显示 `quota n/a`?**
多半是 token 没拿到或该站接口不可用。开 `cc-quota-line config set debug true` 再手动跑一次,stderr 会输出接口原始响应;失败结果会退避 60 秒,排查完记得把 debug 关掉。

**切换了 Provider 但状态栏没变?**
余量缓存按 token 区分,切站即换缓存文件,但 90 秒 TTL 内会显示旧结果,等一会儿就好。

**多账号会串数据吗?**
不会。缓存文件名含 token 指纹(`{provider}-{token前8位}.json`),不同账号各自缓存。

**`install` 说 statusLine 被占用?**
你配置过别的状态栏脚本。想覆盖就 `cc-quota-line install --force`,原配置备份在配置文件的 `install.previousStatusLine`,uninstall 时自动还原。

**旧版 statusline.mjs 用户?**
直接 `cc-quota-line install`,会识别为旧安装自动迁移,无需手动清理。

## 卸载

```bash
cc-quota-line uninstall   # 还原/移除 statusLine
npm uninstall -g cc-quota-line
```

## License

MIT
