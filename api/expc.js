// 법제처 국가법령정보 OPEN API 중계 — 1단계: 연결 시험용
//  · 인증값은 Vercel 환경변수 LAW_OC에만 두고, 응답에는 절대 넣지 않음
//  · 사용 예
//      /api/expc                       → 소방청 법령해석 최신 10건(해석일자 내림차순)
//      /api/expc?q=스프링클러           → 소방청 법령해석 본문 검색
//      /api/expc?id=372876              → 소방청 법령해석 본문 1건
//      /api/expc?t=law&q=소방시설       → 다른 대상(law 현행법령, admrul 행정규칙, expc 법령해석례) 목록 시험
//  · 응답은 CDN에 1시간 캐시(같은 요청이 반복돼도 법제처 호출은 1시간에 1번)
const TIMEOUT = 8000;
const TARGETS = { nfa: "nfaCgmExpc", expc: "expc", law: "law", admrul: "admrul" };

async function get(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "Mozilla/5.0 (hfls.vercel.app)", Referer: "https://hfls.vercel.app/" } });
    return { status: r.status, text: await r.text() };
  } finally {
    clearTimeout(t);
  }
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const oc = (process.env.LAW_OC || "").trim();
  if (!oc) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, error: "LAW_OC 환경변수가 없습니다(Vercel Settings → Environment Variables 등록 후 Redeploy)." }));
  }
  const q = req.query || {};
  const target = TARGETS[String(q.t || "nfa")] || TARGETS.nfa;
  const id = String(q.id || "").replace(/\D/g, "");
  const query = String(q.q || "").slice(0, 50);
  const n = Math.min(100, Math.max(1, parseInt(q.n, 10) || 10));

  const p = new URLSearchParams({ OC: oc, target, type: "JSON" });
  let base;
  if (id) {
    base = "https://www.law.go.kr/DRF/lawService.do";
    p.set("ID", id);
  } else {
    base = "https://www.law.go.kr/DRF/lawSearch.do";
    p.set("display", String(n));
    if (query) {
      p.set("query", query);
      if (target !== "law" && target !== "admrul") p.set("search", "2"); // 해석은 본문 검색
    }
    if (target === "nfaCgmExpc" || target === "expc") p.set("sort", "ddes"); // 해석일자 최신순
  }

  try {
    const { status, text } = await get(`${base}?${p.toString()}`);
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
    const ok = status === 200 && !!data;
    res.setHeader("Cache-Control", ok ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store");
    res.statusCode = ok ? 200 : 502;
    // 실패하면 법제처가 돌려준 문구 앞부분을 보여 원인 파악(인증값은 응답에 없음)
    // 법제처 응답의 상세링크에 OC=인증값이 들어 있으므로 내보내기 전에 모두 지움
    const out = JSON.stringify(
      ok
        ? { ok: true, target, mode: id ? "본문" : "목록", query: query || null, data }
        : { ok: false, target, httpStatus: status, raw: text.replace(/\s+/g, " ").slice(0, 600) },
      null,
      1
    );
    return res.end(out.replace(/OC=[^&"\s]*&?/g, "").split(oc).join("***"));
  } catch (e) {
    res.statusCode = 504;
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ ok: false, error: "법제처 서버 응답 없음(" + (e.name === "AbortError" ? "시간 초과" : e.message) + ")" }));
  }
};
