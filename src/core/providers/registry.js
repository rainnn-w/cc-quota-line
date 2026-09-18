import { makeGlm } from "./glm.js";
import { makeMinimax } from "./minimax.js";
import { makeNewapi } from "./newapi.js";
import { makeDeepseek } from "./deepseek.js";
import { makeMoonshot } from "./moonshot.js";

// providers registry:全部注入 fetchJson;mimo 暂无可用接口,显式返回 null
export function buildQueryers(fetchJson) {
  return {
    glm: makeGlm(fetchJson),
    minimax: makeMinimax(fetchJson),
    newapi: makeNewapi(fetchJson),
    deepseek: makeDeepseek(fetchJson),
    moonshot: makeMoonshot(fetchJson),
    mimo: async () => null,
  };
}
