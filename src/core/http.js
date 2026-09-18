// 工厂:注入 timeoutMs/debug,返回 fetchJson(url, headers)
export function makeFetchJson({ timeoutMs = 4000, debug = false } = {}) {
  return async function fetchJson(url, headers) {
    const res = await fetch(url, {
      headers: { Accept: "application/json, text/plain, */*", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    if (debug) {
      process.stderr.write(`[cc-quota-line] ${res.status} GET ${url}\n${text.slice(0, 600)}\n`);
    }
    return { status: res.status, json, text };
  };
}
