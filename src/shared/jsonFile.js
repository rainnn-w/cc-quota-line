import fs from "node:fs";
import path from "node:path";

// 原子写:先写 .tmp-{pid} 再 rename。
// Windows 上 fs.renameSync 目标存在时也可覆盖(同一卷),经测试验证。
export function atomicWriteJson(file, data, { fs: fsi = fs } = {}) {
  const dir = path.dirname(file);
  fsi.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.tmp-${process.pid}-${path.basename(file)}`);
  fsi.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fsi.renameSync(tmp, file);
}

export function readJson(file, { fs: fsi = fs } = {}) {
  try {
    return JSON.parse(fsi.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
