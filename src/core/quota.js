import { CACHE_DIR } from "../shared/constants.js";
import { tokenTag } from "../shared/utils.js";
import { makeFetchJson } from "./http.js";
import { buildQueryers } from "./providers/registry.js";
import { makeCache } from "./cache.js";

// 查询编排:config → fetchJson → queryers + 缓存包装。
// 返回 { provider, data, fetchedAt }
export async function queryQuota({ baseUrl, token, config, cacheDir = CACHE_DIR }) {
  const { classify } = await import("./classify.js");
  const provider = classify(baseUrl);
  const fetchJson = makeFetchJson({
    timeoutMs: config?.timeoutMs ?? 4000,
    debug: config?.debug ?? false,
  });
  const queryers = buildQueryers(fetchJson);
  const queryFn = queryers[provider.key];

  let data = null;
  let fetchedAt = null;
  if (queryFn && token) {
    const cache = makeCache({
      dir: cacheDir,
      ttlOkMs: (config?.cacheTtlSeconds ?? 90) * 1000,
      ttlFailMs: (config?.failBackoffSeconds ?? 60) * 1000,
    });
    data = await cache.resolve(provider.key, tokenTag(token), () => queryFn({ baseUrl, token }));
    fetchedAt = new Date().toISOString();
  }
  return { provider, data, fetchedAt };
}
