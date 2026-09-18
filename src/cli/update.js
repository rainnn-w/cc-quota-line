// check-update:本地包不发布 npm,registry 404 或请求失败时提示当前版本
export async function checkUpdate(version) {
  try {
    const res = await fetch("https://registry.npmjs.org/cc-quota-line", {
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 404) {
      return `当前版本 v${version}(本地包,未发布 npm;如需更新请在仓库内 git pull)`;
    }
    const json = await res.json();
    const latest = json?.["dist-tags"]?.latest;
    if (latest && latest !== version) {
      return `可更新:当前 v${version} → 最新 v${latest}`;
    }
    return `当前版本 v${version}(已是最新)`;
  } catch {
    return `当前版本 v${version}(无法访问 npm registry)`;
  }
}
