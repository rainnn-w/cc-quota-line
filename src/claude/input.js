// 读 stdin 的 statusline JSON;TTY 返回 null
export async function readStdinJson(stdin = process.stdin) {
  if (stdin.isTTY) return null;
  try {
    const chunks = [];
    for await (const c of stdin) chunks.push(c);
    const text = Buffer.concat(chunks).toString("utf8").trim();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
