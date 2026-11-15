// 테스트용 메모리 Redis(Upstash REST /pipeline 흉내) — api/rank.js가 쓰는 명령만
export function makeFakeRedis() {
  const kv = new Map(), hs = new Map(), zs = new Map();
  const H = (k) => (hs.has(k) ? hs.get(k) : hs.set(k, new Map()).get(k));
  const Z = (k) => (zs.has(k) ? zs.get(k) : zs.set(k, new Map()).get(k));
  const desc = (k) => [...Z(k).entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1)).map((e) => e[0]);
  const run = ([c, k, ...a]) => {
    switch (c) {
      case "INCR": kv.set(k, String(Number(kv.get(k) || 0) + 1)); return Number(kv.get(k));
      case "EXPIRE": return 1;
      case "GET": return kv.has(k) ? kv.get(k) : null;
      case "SET": kv.set(k, a[0]); return "OK";
      case "HGET": return H(k).has(a[0]) ? H(k).get(a[0]) : null;
      case "HSET": H(k).set(a[0], a[1]); return 1;
      case "HSETNX": if (H(k).has(a[0])) return 0; H(k).set(a[0], a[1]); return 1;
      case "HDEL": return H(k).delete(a[0]) ? 1 : 0;
      case "HMGET": return a.map((f) => (H(k).has(f) ? H(k).get(f) : null));
      case "ZADD": Z(k).set(a[1], Number(a[0])); return 1;
      case "ZREM": return Z(k).delete(a[0]) ? 1 : 0;
      case "ZCARD": return Z(k).size;
      case "ZREVRANK": { const i = desc(k).indexOf(a[0]); return i < 0 ? null : i; }
      case "ZREVRANGE": return desc(k).slice(Number(a[0]), Number(a[1]) + 1);
      default: throw new Error("fake redis: " + c);
    }
  };
  const fetch = async (url, opt) => {
    const cmds = JSON.parse(opt.body);
    return { ok: true, json: async () => cmds.map((c) => ({ result: run(c) })) };
  };
  return { fetch, kv, hs, zs };
}
