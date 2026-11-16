// 법제처 국가법령정보 OPEN API 호출 도우미 — 인증값은 Vercel 환경변수 LAW_OC
const TIMEOUT = 8000;

const oc = () => (process.env.LAW_OC || "").trim();

/** lawSearch.do / lawService.do 호출 → JSON (실패 시 throw) */
async function lawJson(path, params, timeout = TIMEOUT) {
  const key = oc();
  if (!key) throw new Error("LAW_OC 없음");
  const p = new URLSearchParams({ OC: key, type: "JSON", ...params });
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(`https://www.law.go.kr/DRF/${path}?${p.toString()}`, {
      signal: ac.signal,
      headers: { "User-Agent": "Mozilla/5.0 (hfls.vercel.app)", Referer: "https://hfls.vercel.app/" },
    });
    if (!r.ok) throw new Error(String(r.status));
    return JSON.parse(await r.text());
  } finally {
    clearTimeout(t);
  }
}

/** 배열이 아니면 배열로 */
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

module.exports = { oc, lawJson, arr };
