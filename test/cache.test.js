import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCache } from "../src/core/cache.js";

// 内存 fs 注入
function memFs(files = {}) {
  const norm = (p) => String(p).replace(/\\/g, "/");
  return {
    _files: files,
    readFileSync(p) {
      const k = norm(p);
      if (!(k in files)) throw new Error("ENOENT");
      return files[k];
    },
    writeFileSync(p, s) {
      files[norm(p)] = s;
    },
    mkdirSync() {},
  };
}

test("缓存命中:同 providerKey+tag TTL 内不发请求", async () => {
  let t = 1000;
  const fs = memFs();
  const cache = makeCache({ dir: "/c", ttlOkMs: 90_000, ttlFailMs: 60_000, now: () => t, fs });
  let calls = 0;
  const q = async () => {
    calls++;
    return { quotas: [] };
  };
  await cache.resolve("glm", "abc12345", q);
  t += 50_000;
  const data = await cache.resolve("glm", "abc12345", q);
  assert.equal(calls, 1);
  assert.deepEqual(data, { quotas: [] });
});

test("TTL 过期后重新查询;失败缓存走退避时长", async () => {
  let t = 0;
  const fs = memFs();
  const cache = makeCache({ dir: "/c", ttlOkMs: 90_000, ttlFailMs: 60_000, now: () => t, fs });
  let calls = 0;
  const ok = async () => {
    calls++;
    return { money: { left: 1 } };
  };
  await cache.resolve("k", "tag", ok);
  t += 91_000;
  await cache.resolve("k", "tag", ok);
  assert.equal(calls, 2);

  // 失败(null)缓存:60s 内不重试
  const fail = async () => {
    calls++;
    return null;
  };
  t += 1000;
  await cache.resolve("f", "tag", fail);
  t += 50_000;
  assert.equal(await cache.resolve("f", "tag", fail), null);
  t += 11_000;
  await cache.resolve("f", "tag", fail);
  assert.equal(calls, 4);
});

test("查询抛异常按失败缓存", async () => {
  const fs = memFs();
  const cache = makeCache({ dir: "/c", now: () => 0, fs });
  const r = await cache.resolve("x", "t", async () => {
    throw new Error("boom");
  });
  assert.equal(r, null);
  const raw = JSON.parse(fs.readFileSync("/c/x-t.json"));
  assert.equal(raw.kind, "fail");
});

test("损坏缓存文件按未命中处理", async () => {
  const fs = memFs({ "/c/x-t.json": "{corrupted" });
  const cache = makeCache({ dir: "/c", now: () => 0, fs });
  const r = await cache.resolve("x", "t", async () => "fresh");
  assert.equal(r, "fresh");
});

test("不同 tag 隔离", async () => {
  const fs = memFs();
  const cache = makeCache({ dir: "/c", now: () => 0, fs });
  let n = 0;
  const q = async () => ++n;
  await cache.resolve("k", "aaaa", q);
  await cache.resolve("k", "bbbb", q);
  assert.equal(n, 2);
});
