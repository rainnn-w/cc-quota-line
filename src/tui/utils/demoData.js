// TUI 预览用演示数据:形状与 provider 返回约定一致(见 src/core/providers/glm.js)。
// 数值刻意跨过 warn/low 阈值,让主题与阈值调整时颜色变化可见。
export const DEMO_QUOTA = {
  provider: { key: "glm", label: "GLM" },
  data: {
    level: "lite",
    quotas: [
      { leftPercent: 68, resetMs: Date.now() + 2.5 * 60 * 60 * 1000, kind: "5h" },
      { leftPercent: 35, resetMs: Date.now() + 4 * 24 * 60 * 60 * 1000, kind: "week" },
    ],
  },
  input: { model: { display_name: "GLM-4.7" } },
};

export const DEMO_MONEY = {
  provider: { key: "deepseek", label: "DeepSeek" },
  data: { money: { left: 23.45, currency: "¥", limit: null } },
  input: { model: { display_name: "deepseek-chat" } },
};
