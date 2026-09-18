// argv 解析:--flag=value | --flag value;位置参数进 _;未知 flag 不报错,进 flags 供忽略。
export function parseArgs(argv) {
  const flags = {};
  const _ = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[a.slice(2)] = next;
          i++;
        } else {
          flags[a.slice(2)] = true;
        }
      }
    } else {
      _.push(a);
    }
  }
  return { flags, _ };
}
