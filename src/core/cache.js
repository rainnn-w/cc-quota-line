import fs from "node:fs";
import path from "node:path";

// 缓存:注入 io(fs)与 now(Date.now),便于测试。
// 文件内容:{ ts, kind: "ok"|"fail", data }
export function makeCache({
  dir,
  ttlOkMs = 90_000,
  ttlFailMs = 60_000,
  now = Date.now,
  fs: fsi = fs,
} = {}) {
  function fileFor(key, tag) {
    return path.join(dir, `${key}-${tag}.json`);
  }

  return {
    async resolve(providerKey, tag, queryFn) {
      const file = fileFor(providerKey, tag);
      let cached = null;
      try {
        cached = JSON.parse(fsi.readFileSync(file, "utf8"));
      } catch {}
      if (cached && typeof cached.ts === "number") {
        const ttl = cached.kind === "ok" ? ttlOkMs : ttlFailMs;
        if (now() - cached.ts < ttl) {
          return cached.kind === "ok" ? cached.data : null;
        }
      }

      let kind = "fail";
      let data = null;
      try {
        data = await queryFn();
        if (data) kind = "ok";
      } catch {}
      try {
        fsi.mkdirSync(dir, { recursive: true });
        fsi.writeFileSync(file, JSON.stringify({ ts: now(), kind, data }));
      } catch {}
      return data;
    },
  };
}
