// 법제처 국가법령정보 OPEN API 중계 — 소방청 법령해석(질의회신)·법제처 법령해석례
//  · 인증값은 Vercel 환경변수 LAW_OC에만 두고, 응답에는 절대 넣지 않음(법제처 상세링크의 OC=… 도 제거)
//  · 사용
//      /api/expc?q=스프링클러[&s=1|2][&page=1][&n=20]  → 목록 { total, page, items:[{id,title,date,org,no}] }
//          s=2(기본) 본문 검색, s=1 안건명 검색
//      /api/expc?id=2657191                             → 본문 { item:{id,title,ask,answer,reason,laws,date,reg,by,org,no} }
//      &t=expc 를 붙이면 법제처 법령해석례(같은 형식, 회신일자 최신순)
//      /api/expc?t=law|admrul&q=…  또는 &raw=1           → 원본 응답(시험용)
//  · 응답은 CDN 캐시(목록 1시간, 본문 1일) — 같은 요청이 반복돼도 법제처 호출은 캐시 시간에 1번
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

const s = (v) =>
  String(v == null ? "" : v)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

/** 20260615 / 2016.03.28 → 2016. 3. 28. */
function fmtDate(v) {
  const m = /^(\d{4})[.-]?(\d{1,2})[.-]?(\d{1,2})/.exec(s(v));
  return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : "";
}

function list(data) {
  const root = data && (data.CgmExpc || data.Expc || Object.values(data)[0]);
  if (!root) return { total: 0, page: 1, items: [] };
  let rows = root.cgmExpc || root.expc || [];
  if (!Array.isArray(rows)) rows = [rows];
  return {
    total: parseInt(root.totalCnt, 10) || 0,
    page: parseInt(root.page, 10) || 1,
    items: rows.map((r) => ({
      id: s(r["법령해석일련번호"] || r["법령해석례일련번호"]),
      title: s(r["안건명"]),
      date: fmtDate(r["해석일자"] || r["회신일자"]),
      org: s(r["질의기관명"]),
      no: s(r["안건번호"]),
    })),
  };
}

function detail(data) {
  const r = (data && (data.CgmExpcService || data.ExpcService || Object.values(data)[0])) || {};
  return {
    item: {
      id: s(r["법령해석일련번호"] || r["법령해석례일련번호"]),
      title: s(r["안건명"]),
      ask: s(r["질의요지"]),
      answer: s(r["회답"]),
      reason: s(r["이유"]),
      laws: s(r["관련법령"]),
      date: fmtDate(r["해석일자"]),
      reg: fmtDate(r["등록일시"]),
      by: s(r["해석기관명"]),
      org: s(r["질의기관명"]),
      no: s(r["안건번호"]),
    },
  };
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
  const raw = target === "law" || target === "admrul" || q.raw === "1";
  const id = String(q.id || "").replace(/\D/g, "");
  const query = String(q.q || "").trim().slice(0, 50);
  const n = Math.min(100, Math.max(1, parseInt(q.n, 10) || 20));
  const page = Math.min(500, Math.max(1, parseInt(q.page, 10) || 1));
  const sec = q.s === "1" ? "1" : "2";

  const p = new URLSearchParams({ OC: oc, target, type: "JSON" });
  let base;
  if (id) {
    base = "https://www.law.go.kr/DRF/lawService.do";
    p.set("ID", id);
  } else {
    base = "https://www.law.go.kr/DRF/lawSearch.do";
    p.set("display", String(n));
    p.set("page", String(page));
    if (query) {
      p.set("query", query);
      if (target !== "law" && target !== "admrul") p.set("search", sec);
    }
    if (target === "expc") p.set("sort", "ddes"); // 법제처 해석례: 회신일자 최신순
  }

  const clean = (txt) => txt.replace(/OC=[^&"\s]*&?/g, "").split(oc).join("***");
  try {
    const { status, text } = await get(`${base}?${p.toString()}`);
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
    const ok = status === 200 && !!data;
    let body;
    if (!ok) body = { ok: false, target, httpStatus: status, raw: text.replace(/\s+/g, " ").slice(0, 600) };
    else if (raw) body = { ok: true, target, mode: id ? "본문" : "목록", query: query || null, data };
    else body = { ok: true, query: query || null, ...(id ? detail(data) : list(data)) };
    res.setHeader("Cache-Control", ok ? `public, s-maxage=${id ? 86400 : 3600}, stale-while-revalidate=86400` : "no-store");
    res.statusCode = ok ? 200 : 502;
    return res.end(clean(JSON.stringify(body)));
  } catch (e) {
    res.statusCode = 504;
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ ok: false, error: "법제처 서버 응답 없음(" + (e.name === "AbortError" ? "시간 초과" : e.message) + ")" }));
  }
};
