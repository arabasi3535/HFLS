// 연혁법 찾기 — 기준일(허가일 등)에 시행 중이던 소방 관계 법령의 조문·별표 원문 (법제처 국가법령정보 OPEN API 중계)
//  · 사람(「연혁법 찾기」 탭)과 AI(사용자가 쓰는 ChatGPT·Claude·Gemini 등이 주소를 직접 열어 읽음)가 함께 사용
//  · 판 찾기: lawSearch.do target=eflaw, efYd=19000101~기준일, sort=efdes → 법령명이 계열과 맞는 첫 판
//    (법령명이 바뀐 계열도 하나로 묶음: 소방법 → 소방시설설치유지법 → 화재예방, 소방시설법 → 소방시설법)
//  · 원문: lawService.do target=eflaw, MST=법령일련번호, efYd=시행일자 → 조문·별표(별표내용 텍스트 + PDF·HWP 링크)
//  · 인증값(LAW_OC)은 서버에만 — 응답의 모든 링크에서 OC 값 제거
//  · 사용법: GET /api/lawat (매개변수 없이) → 사용법 텍스트
const { lawJson, arr, oc } = require("./_law");
// 법제처 eflaw 검색·본문 필드: open.law.go.kr OPEN API 활용가이드(lsEfYdListGuide·lsEfYdInfoGuide)
const { configured, pipeline, clientIp } = require("./_redis");
const fsc = require("./_fsc"); // 화재안전기준(NFSC·NFPC·NFTC) — 행정규칙

const BASE = "https://hfls.vercel.app/api/lawat";
const FAMS = {
  fire: { name: "소방시설 설치·관리", q: ["소방시설", "소방법"], re: /^(화재예방)?소방시설설치(유지)?(및안전관리|및관리)에관한법률$|^소방법$/, note: "소방법(~2004.5.29.) → 소방시설설치유지및안전관리에관한법률(2004.5.30.~) → 소방시설 설치·유지 및 안전관리에 관한 법률(2012.2.5.~) → 화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률(2016.1.21.~) → 소방시설 설치 및 관리에 관한 법률(2022.12.1.~)" },
  prevent: { name: "화재예방법", q: ["화재의 예방"], re: /^화재의예방및안전관리에관한법률$/, note: "2022.12.1. 시행(그 전 안전관리 규정은 소방시설법 계열·소방법에 있음)" },
  work: { name: "소방시설공사업법", q: ["소방시설공사업법"], re: /^소방시설공사업법$/, note: "2004.5.30. 시행(그 전은 소방법)" },
  basic: { name: "소방기본법", q: ["소방기본법"], re: /^소방기본법$/, note: "2004.5.30. 시행(그 전은 소방법)" },
  multi: { name: "다중이용업소법", q: ["다중이용업소"], re: /^다중이용업소의안전관리에관한특별법$/, note: "다중이용업소의 안전관리에 관한 특별법" },
  haz: { name: "위험물안전관리법", q: ["위험물안전관리법"], re: /^위험물안전관리법$/, note: "2004.5.30. 시행(그 전은 소방법)" },
  build: { name: "건축법", q: ["건축법"], re: /^건축법$/, note: "용도 분류: 건축법 시행령 별표1" },
  tech: { name: "소방기술기준에관한규칙", q: ["소방기술기준"], re: /^소방기술기준에관한규칙$/, note: "화재안전기준(2004.6.4. 고시) 전의 소방시설 기술기준 — kind=law로 조회" },
};
const KINDS = { law: { name: "법률", suf: "" }, dec: { name: "시행령", suf: "시행령" }, rule: { name: "시행규칙", suf: "시행규칙" } };

const norm = (s) => String(s || "").replace(/[\s·ㆍ・,]/g, "");
/** 검색 결과 법령명이 계열·종류와 맞는지 */
function matches(famId, kind, name) {
  const fam = FAMS[famId];
  const n = norm(name);
  const suf = KINDS[kind].suf;
  if (suf && !n.endsWith(suf)) return false;
  const core = suf ? n.slice(0, -suf.length) : n;
  if (!suf && /(시행령|시행규칙)$/.test(core)) return false;
  return fam.re.test(core);
}
/** 2003-05-01 / 20030501 / 2003.5.1. → 20030501 */
function toYmd(v) {
  const m = /^(\d{4})\D*(\d{1,2})\D*(\d{1,2})/.exec(String(v || "").trim());
  if (!m) return "";
  const s = `${m[1]}${m[2].padStart(2, "0")}${m[3].padStart(2, "0")}`;
  return +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31 ? s : "";
}
const dash = (s) => (/^\d{8}$/.test(String(s)) ? `${String(s).slice(0, 4)}-${String(s).slice(4, 6)}-${String(s).slice(6)}` : String(s || ""));
/** 제10조의2 / 10-2 / 10의2 → "10-2" */
function normNo(v) {
  const m = /(\d+)\s*(?:조)?\s*(?:의|-)?\s*(\d+)?/.exec(String(v || "").replace(/^\s*(제|별표)\s*/, ""));
  if (!m) return "";
  return m[2] && +m[2] ? `${+m[1]}-${+m[2]}` : String(+m[1]);
}
const noLabel = (k) => (k.includes("-") ? k.replace("-", "의") : k);
const joLabel = (k) => (k.includes("-") ? `제${k.split("-")[0]}조의${k.split("-")[1]}` : `제${k}조`);

const clean = (v) =>
  String(v == null ? "" : v)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+$/gm, "")
    .replace(/^\n+|\n+$/g, "");
const txt = (v) => (Array.isArray(v) ? v.map(txt).filter(Boolean).join("\n") : v && typeof v === "object" ? "" : clean(v));
/** 법제처 링크 → 절대 주소, OC 값 제거 */
const absLink = (v) => {
  const s = clean(v);
  if (!s) return "";
  const u = s.startsWith("http") ? s : `https://www.law.go.kr${s.startsWith("/") ? "" : "/"}${s}`;
  return u.replace(/([?&])OC=[^&]*&?/gi, "$1").replace(/[?&]$/, "");
};

function walk(o, fn) {
  if (Array.isArray(o)) o.forEach((x) => walk(x, fn));
  else if (o && typeof o === "object") {
    fn(o);
    for (const v of Object.values(o)) if (v && typeof v === "object") walk(v, fn);
  }
}
function articleText(a) {
  const lines = [txt(a["조문내용"])];
  for (const h of arr(a["항"])) {
    lines.push(txt(h["항내용"]));
    for (const ho of arr(h["호"])) {
      lines.push(txt(ho["호내용"]));
      for (const m of arr(ho["목"])) lines.push(txt(m["목내용"]));
    }
  }
  return lines.filter(Boolean).join("\n");
}
/** lawService.do(eflaw) JSON → { info, arts:[{k,label,head,text}], byls:[{k,title,text,links}] } — 구조가 조금 달라도 찾도록 트리 전체를 훑음 */
function parseLaw(j) {
  const info = {};
  const arts = [];
  const byls = [];
  walk(j, (o) => {
    if (!info.name && (o["법령명_한글"] || o["법령명한글"])) {
      info.name = txt(o["법령명_한글"] || o["법령명한글"]);
      info.no = txt(o["공포번호"]);
      info.pub = txt(o["공포일자"]);
      info.eff = txt(o["시행일자"]);
      info.kind = txt(o["법종구분"] && typeof o["법종구분"] === "object" ? o["법종구분"].content : o["법종구분"]);
      info.why = txt(o["제개정구분"]);
    }
    if ("조문번호" in o && ("조문내용" in o || "조문제목" in o)) {
      const k = normNo(`${txt(o["조문번호"])}${+txt(o["조문가지번호"]) ? `-${txt(o["조문가지번호"])}` : ""}`);
      const head = txt(o["조문여부"]) === "전문";
      const title = txt(o["조문제목"]);
      arts.push({ k, head, label: head ? txt(o["조문내용"]).trim() : `${joLabel(k)}${title ? `(${title})` : ""}`, text: articleText(o) });
    }
    // 별표: 별표번호가 없는 옛 판도 별표내용·별표제목이 있으면 받음(번호는 제목의 「별표 N」에서 추정)
    if (("별표내용" in o || "별표제목" in o) && !("조문번호" in o)) {
      if (txt(o["별표구분"]) === "서식") return;
      const guess = /별표\s*(\d+)(?:\s*의\s*(\d+))?/.exec(`${txt(o["별표제목"])} ${txt(o["별표내용"]).slice(0, 40)}`);
      const k = "별표번호" in o
        ? normNo(`${txt(o["별표번호"])}${+txt(o["별표가지번호"]) ? `-${txt(o["별표가지번호"])}` : ""}`)
        : guess ? normNo(`${guess[1]}${guess[2] ? `-${guess[2]}` : ""}`) : String(byls.length + 1);
      const links = {};
      if (o["별표서식PDF파일링크"]) links.pdf = absLink(o["별표서식PDF파일링크"]);
      if (o["별표서식파일링크"]) links.hwp = absLink(o["별표서식파일링크"]);
      if (o["별표서식이미지파일링크"]) links.img = absLink(arr(o["별표서식이미지파일링크"])[0]);
      byls.push({ k, title: txt(o["별표제목"]), text: txt(o["별표내용"]), links });
    }
  });
  return { info, arts, byls };
}

// ---------- 법제처 호출 ----------
const pick = (x) => ({
  name: txt(x["법령명한글"]),
  mst: txt(x["법령일련번호"]),
  eff: txt(x["시행일자"]),
  pub: txt(x["공포일자"]),
  no: txt(x["공포번호"]),
  kind: txt(x["법령구분명"]),
  why: txt(x["제개정구분명"]),
});
const later_ = (a, b) => (a.eff !== b.eff ? a.eff > b.eff : a.pub !== b.pub ? a.pub > b.pub : +a.mst > +b.mst);
async function search(q, efYd, sort, page) {
  const j = await lawJson("lawSearch.do", { target: "eflaw", query: q, efYd, sort, display: "100", page: String(page) });
  const ls = j.LawSearch || {};
  return { list: arr(ls.law), total: +ls.totalCnt || 0 };
}
/** 기준일에 시행 중이던 판(efdes) 또는 기준일 다음 판(efasc) */
async function findOne(famId, kind, efYd, dir) {
  // 계열의 검색어별로 동시에 조회(응답 시간 단축)
  const found = await Promise.all(
    FAMS[famId].q.map(async (q) => {
      for (let page = 1; page <= 3; page++) {
        const { list, total } = await search(q, efYd, dir === "prev" ? "efdes" : "efasc", page);
        const hits = list.filter((x) => matches(famId, kind, x["법령명한글"])).map(pick);
        if (hits.length) return hits;
        if (page * 100 >= total) break;
      }
      return [];
    })
  );
  let best = null;
  for (const h of found.flat()) if (!best || (dir === "prev" ? later_(h, best) : later_(best, h))) best = h;
  return best;
}
async function listAll(famId, kind) {
  const out = new Map();
  for (const q of FAMS[famId].q) {
    for (let page = 1; page <= 5; page++) {
      const { list, total } = await search(q, "19000101~99991231", "efasc", page);
      for (const x of list) if (matches(famId, kind, x["법령명한글"])) { const v = pick(x); out.set(`${v.mst}:${v.eff}`, v); }
      if (page * 100 >= total) break;
    }
  }
  return [...out.values()].sort((a, b) => (a.eff === b.eff ? (a.pub < b.pub ? -1 : 1) : a.eff < b.eff ? -1 : 1));
}
const mem = new Map();
async function loadDoc(mst, eff) {
  const key = `hfls:lawat:doc:${mst}:${eff}`;
  if (mem.has(key)) return mem.get(key);
  if (configured()) {
    try {
      const [raw] = await pipeline([["GET", key]]);
      if (raw) { const d = JSON.parse(raw); mem.set(key, d); return d; }
    } catch (e) { /* 캐시 실패는 무시 */ }
  }
  const j = await lawJson("lawService.do", { target: "eflaw", MST: mst, efYd: eff }, 20000);
  const d = parseLaw(j);
  if (!d.arts.length && !d.byls.length) {
    const e = new Error("본문을 읽지 못함");
    e.keys = Object.keys(j || {}).slice(0, 10);
    throw e;
  }
  if (mem.size > 20) mem.delete(mem.keys().next().value);
  mem.set(key, d);
  const s = JSON.stringify(d);
  if (configured() && s.length < 900000) {
    try { await pipeline([["SET", key, s, "EX", 60 * 60 * 24 * 30]]); } catch (e) { /* 무시 */ }
  }
  return d;
}

// ---------- 출력 ----------
const lawLink = (v) => `https://www.law.go.kr/lsInfoP.do?lsiSeq=${v.mst}&efYd=${v.eff}`;
const verLine = (v) => `${v.name} [${v.kind || ""} 제${String(v.no).replace(/^제|호$/g, "")}호, ${dash(v.pub)} 공포, ${dash(v.eff)} 시행${v.why ? `, ${v.why}` : ""}]`;

function usageText() {
  return [
    "HFLS 연혁법 찾기 — 기준일에 시행 중이던 소방 관계 법령 원문(법제처 국가법령정보 OPEN API)",
    "",
    "요청: " + BASE + "?fam=계열&kind=종류&date=YYYY-MM-DD[&jo=조문][&byl=별표][&q=검색어][&list=1]&format=text",
    "  fam  : " + Object.entries(FAMS).map(([k, f]) => `${k}=${f.name}`).join(", "),
    "  kind : law=법률, dec=시행령(기본), rule=시행규칙",
    "  date : 기준일(허가일·신청일 등) — 이 날 시행 중이던 판을 찾음",
    "  jo   : 조문 번호(예: 10, 10-2=제10조의2)   byl: 별표 번호(예: 4, 1-2=별표1의2)",
    "  q    : 그 판 안에서 낱말 검색(조문·별표 위치와 앞뒤 문장)",
    "  list : 1이면 계열 전체 개정 연혁(시행일 순)",
    "  format: text(사람·AI가 읽기 쉬운 글) / json",
    "",
    "예시",
    `  ${BASE}?fam=fire&kind=dec&date=2003-05-01&format=text            (2003.5.1. 시행 중이던 소방법 시행령 목차)`,
    `  ${BASE}?fam=fire&kind=dec&date=2003-05-01&byl=1&format=text      (그 판의 별표1)`,
    `  ${BASE}?fam=fire&kind=dec&date=2012-03-01&q=스프링클러&format=text`,
    `  ${BASE}?fam=fire&kind=dec&list=1&format=text                      (개정 연혁 목록)`,
    "",
    "■ 화재안전기준(설비별 설치기준 — NFSC → 2022.12.1.부터 성능기준 NFPC·기술기준 NFTC)",
    "요청: " + BASE + "?std=설비번호&date=YYYY-MM-DD[&ty=p|t][&jo=조문·절][&byl=별표][&q=검색어][&list=1]&format=text",
    "  std  : " + fsc.STDS.map(([k, n]) => `${k}=${n}`).join(", "),
    "  ty   : 생략=자동(기술기준 NFTC가 있으면 NFTC, 2022.12.1. 전이면 NFSC), p=화재안전기준·성능기준(NFSC·NFPC), t=기술기준(NFTC)",
    "  jo   : 옛 판(NFSC·NFPC)은 조문 번호(예: 10, 10-2), NFTC는 절 번호(예: 2.1), 부칙은 jo=부칙",
    "  예시 : " + BASE + "?std=103&date=2012-03-01&format=text   (2012.3.1. 시행 중이던 스프링클러설비의 화재안전기준 목차)",
    "         " + BASE + "?std=103&date=2012-03-01&jo=10&format=text",
    "         " + BASE + "?std=103&list=1&format=text   (스프링클러설비 기준 개정 연혁)",
    "  2004.6.4. 전(화재안전기준 고시 전): " + BASE + "?fam=tech&kind=law&date=YYYY-MM-DD&format=text (소방기술기준에관한규칙)",
    "",
    "계열 설명: " + Object.values(FAMS).map((f) => `${f.name}: ${f.note}`).join(" / "),
    "주의: 원문 확인용 참고 자료입니다. 별표 텍스트가 없는 옛 판은 PDF·HWP 링크로 확인하십시오.",
  ].join("\n");
}

function renderStd(out) {
  const L = [];
  const nm = `${out.std} ${fsc.STD_NAME[out.std] || ""}`;
  if (out.versions) {
    L.push(`화재안전기준 ${nm} — 개정 연혁 ${out.versions.length}건 (시행일 순, NFSC·NFPC=p, NFTC=t)`);
    for (const v of out.versions) L.push(`- ${dash(v.eff)} 시행 | [${v.track}] ${v.name} | ${fsc.admNo(v)} (${dash(v.pub)} 발령, ${v.why})`);
    L.push("", `기준일 원문: ${BASE}?std=${out.std}&date=YYYY-MM-DD&format=text`);
    return L.join("\n");
  }
  L.push(`[기준일] ${dash(out.date)}에 시행 중이던 판`, `[기준] ${fsc.admLine(out.ver)}`);
  L.push(`[이 판의 적용 기간] ${dash(out.ver.eff)} ~ ${out.next ? `${dash(out.next.eff)} 전날 (다음 판: ${out.next.name}, ${dash(out.next.eff)} 시행)` : "현재(또는 이후 판 없음)"}`);
  L.push(`[법제처 원문] ${out.link}`);
  for (const n of out.notes || []) L.push(`[참고] ${n}`);
  if (out.art) L.push("", `■ ${out.art.label}`, out.art.text);
  else if (out.byl) {
    L.push("", `■ 별표 ${noLabel(out.byl.k)} ${out.byl.title}`);
    L.push(out.byl.text || "(별표 텍스트 없음 — 아래 파일로 확인)");
    for (const [k, u] of Object.entries(out.byl.links || {})) L.push(`  ${k.toUpperCase()}: ${u}`);
  } else if (out.hits) {
    L.push("", `■ "${out.q}" 검색 결과 ${out.hits.length}건`);
    for (const h of out.hits) L.push(`- ${h.where}: …${h.snip}…`);
  } else if (out.toc) {
    L.push("", `■ ${out.ver.track === "t" ? "절" : "조문"} 목차 (jo=번호로 원문)`);
    for (const a of out.toc.arts) L.push(a.head ? `  ${a.label}` : `  jo=${a.k}  ${a.label}`);
    if (out.toc.byls.length) {
      L.push("", "■ 별표 (byl=번호로 원문)");
      for (const b of out.toc.byls) L.push(`  byl=${b.k}  별표 ${noLabel(b.k)} ${b.title}${b.hasText ? "" : " (텍스트 없음 — 파일 링크)"}`);
    }
    if (out.toc.files.length) {
      L.push("", "■ 첨부파일(고시·공고 원본 — 그림·표 포함)");
      for (const f of out.toc.files) L.push(`  ${f.name}: ${f.url}`);
    }
  }
  L.push("", "※ 참고용 원문 중계(HFLS). 최종 판단은 법제처 원문·관보로 확인.");
  return L.join("\n");
}

function render(out, format) {
  if (format !== "text") return JSON.stringify(out);
  if (out.std) return renderStd(out);
  const L = [];
  if (out.versions) {
    L.push(`${FAMS[out.fam].name} ${KINDS[out.kind].name} — 개정 연혁 ${out.versions.length}건 (시행일 순)`);
    for (const v of out.versions) L.push(`- ${dash(v.eff)} 시행 | ${v.name} | ${v.kind} 제${String(v.no).replace(/^제|호$/g, "")}호 (${dash(v.pub)} 공포, ${v.why})`);
    L.push("", `기준일 원문: ${BASE}?fam=${out.fam}&kind=${out.kind}&date=YYYY-MM-DD&format=text`);
    return L.join("\n");
  }
  L.push(`[기준일] ${dash(out.date)}에 시행 중이던 판`, `[법령] ${verLine(out.ver)}`);
  L.push(`[이 판의 적용 기간] ${dash(out.ver.eff)} ~ ${out.next ? `${dash(out.next.eff)} 전날 (다음 판: ${out.next.name}, ${dash(out.next.eff)} 시행)` : "현재(또는 이후 판 없음)"}`);
  L.push(`[법제처 원문] ${lawLink(out.ver)}`);
  if (out.art) L.push("", `■ ${out.art.label}`, out.art.text);
  else if (out.byl) {
    L.push("", `■ 별표 ${noLabel(out.byl.k)} ${out.byl.title}`);
    L.push(out.byl.text || "(이 판의 별표 텍스트가 법제처 API에 없음 — 아래 파일로 확인)");
    for (const [k, u] of Object.entries(out.byl.links || {})) L.push(`  ${k.toUpperCase()}: ${u}`);
  } else if (out.hits) {
    L.push("", `■ "${out.q}" 검색 결과 ${out.hits.length}건`);
    for (const h of out.hits) L.push(`- ${h.where}: …${h.snip}…`);
  } else if (out.toc) {
    L.push("", "■ 조문 목차 (jo=번호로 원문)");
    for (const a of out.toc.arts) L.push(a.head ? `  ${a.label}` : `  jo=${a.k}  ${a.label}`);
    L.push("", "■ 별표 (byl=번호로 원문)");
    if (!out.toc.byls.length) L.push(`  (이 판의 별표는 법제처 OPEN API에 없음 — 법제처 원문 화면의 「별표·서식」에서 확인: ${lawLink(out.ver)})`);
    for (const b of out.toc.byls) L.push(`  byl=${b.k}  별표 ${noLabel(b.k)} ${b.title}${b.hasText ? "" : " (텍스트 없음 — 파일 링크)"}`);
  }
  L.push("", "※ 참고용 원문 중계(HFLS). 최종 판단은 법제처 원문·관보로 확인.");
  return L.join("\n");
}

/** 키 구조만(값 제외) — 배열은 길이와 첫 항목 구조 */
function shapeOf(v, depth) {
  if (Array.isArray(v)) return depth ? [`배열 ${v.length}개`, shapeOf(v[0], depth - 1)] : `배열 ${v.length}개`;
  if (v && typeof v === "object") {
    if (!depth) return "{…}";
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!/^OC$/i.test(k)) o[k] = shapeOf(x, depth - 1);
    return o;
  }
  return typeof v;
}

function snippets(d, q) {
  const hits = [];
  const find = (where, text) => {
    let i = text.indexOf(q);
    let n = 0;
    while (i >= 0 && n < 3 && hits.length < 30) {
      hits.push({ where, snip: text.slice(Math.max(0, i - 40), i + q.length + 60).replace(/\s+/g, " ") });
      i = text.indexOf(q, i + q.length);
      n++;
    }
  };
  for (const a of d.arts) if (!a.head) find(`jo=${a.k} ${a.label}`, a.text);
  for (const b of d.byls) find(`byl=${b.k} 별표 ${noLabel(b.k)}`, `${b.title}\n${b.text}`);
  return hits;
}

async function rateOk(req) {
  if (!configured()) return true;
  try {
    const k = `hfls:lawat:rl:${clientIp(req)}`;
    const [n] = await pipeline([["INCR", k]]);
    if (n === 1) await pipeline([["EXPIRE", k, 600]]);
    return n <= 120; // 10분에 120회
  } catch (e) {
    return true;
  }
}

// ---------- 화재안전기준 ----------
async function handleStd(qy, send, fail) {
  const std = fsc.normCode(qy.std);
  if (!fsc.STD_NAME[std]) return fail(400, `std(설비 번호)를 확인하십시오: ${fsc.STDS.map((s) => s[0]).join(", ")}`);
  const idx = await fsc.loadIndex();
  const chain = fsc.chainOf(idx, std);
  if (!chain.length) return fail(404, `법제처 목록에서 ${std} ${fsc.STD_NAME[std]} 기준을 찾지 못했습니다.`);
  const cache = "public, s-maxage=86400, stale-while-revalidate=604800";
  if (qy.list) return send(200, { ok: true, std, versions: chain }, cache);
  const date = toYmd(qy.date);
  if (!date) return fail(400, "date(기준일)를 YYYY-MM-DD 형식으로 넣으십시오.");
  const ty = qy.ty === "p" || qy.ty === "t" ? qy.ty : "";
  const r = fsc.resolve(chain, date, ty);
  if (!r.cur) {
    if (date < fsc.FIRST) return fail(404, `화재안전기준은 2004.6.4.부터 시행된 고시입니다. 그 전의 설비 기술기준은 「소방기술기준에관한규칙」에서 확인하십시오 — ${BASE}?fam=tech&kind=law&date=${dash(date)}&format=text`, { before: { fam: "tech", kind: "law" } });
    return fail(404, `${dash(date)}에는 ${std} ${fsc.STD_NAME[std]} 기준이 아직 없었습니다(최초 시행 ${dash(chain[0].eff)}).`, { first: chain[0].eff });
  }
  const d = await fsc.loadAdm(r.cur.seq);
  const notes = [];
  if (r.note) notes.push(r.note);
  if (fsc.NOTES[std]) notes.push(fsc.NOTES[std]);
  if (r.track === "p" && date >= fsc.SPLIT) notes.push("2022.12.1.부터 세부 기술 내용은 기술기준(NFTC, ty=t)에 있습니다.");
  const out = { ok: true, std, date, ty: r.track, ver: r.cur, next: r.next, link: fsc.admLink(r.cur), notes };
  if (qy.jo) {
    const raw = String(qy.jo).trim().replace(/^제\s*/, "");
    const k = raw === "부칙" ? raw : /^\d+(\.\d+)+$/.test(raw) ? raw : normNo(raw);
    const art = d.arts.find((a) => !a.head && a.k === k);
    if (!art) return fail(404, `이 판에 ${k}이(가) 없습니다(번호가 판마다 다를 수 있음 — 목차를 먼저 확인).`, { ver: r.cur });
    out.art = art;
  } else if (qy.byl) {
    const k = normNo(qy.byl);
    const byl = d.byls.find((b) => b.k === k);
    if (!byl) return fail(404, `이 판에 별표 ${noLabel(k)}가 없습니다(목차 확인).`, { ver: r.cur });
    out.byl = byl;
  } else if (qy.q) {
    out.q = String(qy.q).slice(0, 40);
    out.hits = snippets(d, out.q);
  } else {
    out.toc = { arts: d.arts.map(({ k, label, head }) => ({ k, label, head })), byls: d.byls.map((b) => ({ k: b.k, title: b.title, hasText: !!b.text })), files: d.files || [] };
  }
  return send(200, out, cache);
}

// ---------- 용어 정의(v2.48.0) — 현행 법령·화재안전성능기준의 「정의」 조문 모음 ----------
//  ?defs=fire|prevent|work|basic|multi|haz|build&format=json → 그 계열 법률·시행령·시행규칙의 정의 조문
//  ?defs=std&page=N&format=json → 화재안전성능기준(NFPC) 6개씩
//  조문을 용어별로 나누는 일은 화면(src/law/defs.js)에서 함
const { bylDefs } = require("./_bylDefs");
const DEF_RE = /\((?:용어의\s*)?정의\)/;
const DEF_PER = 6;
const pickDefs = (d) => d.arts.filter((a) => !a.head && DEF_RE.test(a.label || "")).map(({ k, label, text }) => ({ k, label, text }));
async function handleDefs(qy, send, fail) {
  const today = toYmd(new Date(Date.now() + 9 * 3600 * 1000).toISOString());
  const cache = "public, s-maxage=604800, stale-while-revalidate=2592000";
  if (qy.defs === "std") {
    const pages = Math.ceil(fsc.STDS.length / DEF_PER);
    const page = Math.min(pages, Math.max(1, parseInt(qy.page, 10) || 1));
    const idx = await fsc.loadIndex();
    const items = await Promise.all(
      fsc.STDS.slice((page - 1) * DEF_PER, page * DEF_PER).map(async ([std, name]) => {
        try {
          const r = fsc.resolve(fsc.chainOf(idx, std), today, "p");
          if (!r.cur) return { std, name, error: "현행 기준 없음" };
          const d = await fsc.loadAdm(r.cur.seq);
          return { std, name, ver: r.cur, link: fsc.admLink(r.cur), arts: pickDefs(d) };
        } catch (e) {
          return { std, name, error: e.message };
        }
      })
    );
    return send(200, JSON.stringify({ ok: true, defs: "std", page, pages, date: today, items }), cache);
  }
  const fam = FAMS[qy.defs] && qy.defs !== "tech" ? qy.defs : "";
  if (!fam) return fail(400, `defs는 ${Object.keys(FAMS).filter((k) => k !== "tech").join("|")}|std 중 하나입니다.`);
  const items = await Promise.all(
    Object.keys(KINDS).map(async (kind) => {
      try {
        const ver = await findOne(fam, kind, `19000101~${today}`, "prev");
        if (!ver) return { kind, error: "현행 법령 없음" };
        const d = await loadDoc(ver.mst, ver.eff);
        return { kind, ver, link: lawLink(ver), arts: pickDefs(d), byls: d.byls.flatMap(bylDefs) }; // (v2.49.0) 별표 비고 등의 정의
      } catch (e) {
        return { kind, error: e.message };
      }
    })
  );
  return send(200, JSON.stringify({ ok: true, defs: fam, name: FAMS[fam].name, date: today, items }), cache);
}

module.exports = async (req, res) => {
  const qy = req.query || {};
  const format = qy.format === "json" ? "json" : "text"; // 기본은 글(AI가 format을 빠뜨려도 읽기 쉽게) — 탭 화면은 format=json
  const send = (code, out, cache) => {
    res.setHeader("Content-Type", format === "text" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", cache || "no-store");
    return res.status(code).send(typeof out === "string" ? out : render(out, format));
  };
  const fail = (code, msg, extra) => send(code, format === "text" ? `오류: ${msg}\n\n${usageText()}` : { ok: false, error: msg, ...(extra || {}) });

  if (!qy.fam && !qy.list && !qy.std && !qy.defs) return send(200, format === "json" ? JSON.stringify({ ok: true, usage: usageText(), fams: Object.fromEntries(Object.entries(FAMS).map(([k, f]) => [k, { name: f.name, note: f.note }])), stds: fsc.STDS }) : usageText(), "public, s-maxage=86400");
  const fam = FAMS[qy.fam] ? qy.fam : "fire";
  const kind = KINDS[qy.kind] ? qy.kind : "dec";
  if (!oc()) return fail(503, "서버에 법제처 인증값(LAW_OC)이 설정되지 않았습니다.");
  if (!(await rateOk(req))) return fail(429, "요청이 너무 많습니다. 10분 뒤 다시 시도하십시오.");
  try {
    if (qy.defs) return await handleDefs(qy, send, fail);
    if (qy.std) return await handleStd(qy, send, fail);
    if (qy.list) {
      const versions = await listAll(fam, kind);
      return send(200, { ok: true, fam, kind, versions }, "public, s-maxage=86400, stale-while-revalidate=604800");
    }
    const date = toYmd(qy.date);
    if (!date) return fail(400, "date(기준일)를 YYYY-MM-DD 형식으로 넣으십시오.");
    const ver = await findOne(fam, kind, `19000101~${date}`, "prev");
    if (!ver) return fail(404, `${dash(date)}에 시행 중이던 ${FAMS[fam].name} ${KINDS[kind].name}을(를) 찾지 못했습니다. (${FAMS[fam].note})`);
    if (qy.shape) {
      // 구조 확인용(값 없이 키 이름·배열 길이만) — 옛 판 별표 위치 확인 등
      const j = await lawJson("lawService.do", { target: "eflaw", MST: ver.mst, efYd: ver.eff }, 20000);
      return send(200, JSON.stringify({ ok: true, ver, shape: shapeOf(j, 5) }), "public, s-maxage=3600");
    }
    const nextFrom = toYmd(new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6) + 1)).toISOString());
    const [nx, d] = await Promise.all([findOne(fam, kind, `${nextFrom}~99991231`, "next"), loadDoc(ver.mst, ver.eff)]);
    const out = { ok: true, fam, kind, date, ver, next: nx, link: lawLink(ver) };
    if (qy.jo) {
      const k = normNo(qy.jo);
      const art = d.arts.find((a) => !a.head && a.k === k);
      if (!art) return fail(404, `이 판에 ${joLabel(k)}가 없습니다(조문 번호가 판마다 다를 수 있음 — 목차를 먼저 확인).`, { ver });
      out.art = art;
    } else if (qy.byl) {
      const k = normNo(qy.byl);
      const byl = d.byls.find((b) => b.k === k);
      if (!byl) return fail(404, `이 판에 별표 ${noLabel(k)}가 없습니다(목차 확인).`, { ver });
      out.byl = byl;
    } else if (qy.q) {
      out.q = String(qy.q).slice(0, 40);
      out.hits = snippets(d, out.q);
    } else {
      out.toc = { arts: d.arts.map(({ k, label, head }) => ({ k, label, head })), byls: d.byls.map((b) => ({ k: b.k, title: b.title, hasText: !!b.text })) };
    }
    return send(200, out, "public, s-maxage=86400, stale-while-revalidate=604800");
  } catch (e) {
    return fail(502, `법제처 응답을 받지 못했습니다(${e.message}).`, e.keys ? { keys: e.keys } : undefined);
  }
};
module.exports._t = { matches, toYmd, normNo, parseLaw, render, snippets, absLink, usageText, shapeOf, FAMS, fsc };
