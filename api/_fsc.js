// 화재안전기준(NFSC → NFPC·NFTC) 연혁 — 법제처 행정규칙(admrul) OPEN API
//  · 목록: lawSearch.do target=admrul, nw=2(연혁 포함), sort=efasc — 「화재안전기준·화재안전성능기준·화재안전기술기준」 세 낱말로 모은 색인
//    (이름의 「(NFSC 103)」 같은 번호로 설비를 가리고, 같은 행정규칙ID끼리 한 계열로 묶음: NFSC → NFPC 는 같은 ID, NFTC 는 별도 ID)
//  · 원문: lawService.do target=admrul, ID=행정규칙일련번호 → 조문내용(옛 판: 조문 배열 / NFTC: 긴 글 하나 → 1.1·2.1 단위로 나눔), 별표, 첨부파일, 부칙
//  · 2004.6.4. 전에는 화재안전기준이 없음(소방기술기준에관한규칙 → fam=tech)
const { lawJson, arr } = require("./_law");
const { configured, pipeline } = require("./_redis");

// 설비 목록(화재안전기준 번호 순) — 이름은 현행 기준
const STDS = [
  ["101", "소화기구 및 자동소화장치"],
  ["102", "옥내소화전설비"],
  ["103", "스프링클러설비"],
  ["103A", "간이스프링클러설비"],
  ["103B", "화재조기진압용 스프링클러설비"],
  ["104", "물분무소화설비"],
  ["104A", "미분무소화설비"],
  ["105", "포소화설비"],
  ["106", "이산화탄소소화설비"],
  ["107", "할론소화설비"],
  ["107A", "할로겐화합물 및 불활성기체소화설비"],
  ["108", "분말소화설비"],
  ["109", "옥외소화전설비"],
  ["110", "고체에어로졸소화설비"],
  ["201", "비상경보설비 및 단독경보형감지기"],
  ["202", "비상방송설비"],
  ["203", "자동화재탐지설비 및 시각경보장치"],
  ["204", "자동화재속보설비"],
  ["205", "누전경보기"],
  ["206", "가스누설경보기"],
  ["207", "화재알림설비"],
  ["301", "피난기구"],
  ["302", "인명구조기구"],
  ["303", "유도등 및 유도표지"],
  ["304", "비상조명등"],
  ["401", "상수도소화용수설비"],
  ["402", "소화수조 및 저수조"],
  ["501", "제연설비"],
  ["501A", "특별피난계단의 계단실 및 부속실 제연설비"],
  ["502", "연결송수관설비"],
  ["503", "연결살수설비"],
  ["504", "비상콘센트설비"],
  ["505", "무선통신보조설비"],
  ["506", "연소방지설비"],
  ["602", "소방시설용 비상전원수전설비"],
  ["603", "도로터널"],
  ["604", "고층건축물"],
  ["605", "지하구"],
  ["606", "임시소방시설"],
  ["607", "전기저장시설"],
  ["608", "공동주택"],
  ["609", "창고시설"],
];
const STD_NAME = Object.fromEntries(STDS);
const NOTES = {
  506: "2021.1.15.부터 「지하구의 화재안전기준(NFSC 605)」으로 바뀜(같은 행정규칙 계열)",
  605: "2021.1.15. 전에는 「연소방지설비의 화재안전기준(NFSC 506)」",
  107: "옛 이름: 할로겐화합물소화설비",
  "107A": "옛 이름: 청정소화약제소화설비",
};
const FIRST = "20040604"; // 화재안전기준 최초 시행(소방방재청 고시)
const SPLIT = "20221201"; // 성능기준(NFPC)·기술기준(NFTC) 분리 시행
const Q = ["화재안전기준", "화재안전성능기준", "화재안전기술기준"];

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
const absLink = (v) => {
  const s = clean(v);
  if (!s) return "";
  const u = s.startsWith("http") ? s : `https://www.law.go.kr${s.startsWith("/") ? "" : "/"}${s}`;
  return u.replace(/^http:\/\//, "https://").replace(/([?&])OC=[^&]*&?/gi, "$1").replace(/[?&]$/, "");
};
const normCode = (v) => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^(NFSC|NFPC|NFTC)/, "");
/** 「스프링클러설비의 화재안전성능기준(NFPC 103)」 → { std:"NFPC", code:"103" } */
function codeOf(name) {
  const m = /\(\s*(NFSC|NFPC|NFTC)\s*(\d{3}[A-Z]?)\s*\)/i.exec(String(name || ""));
  return m ? { std: m[1].toUpperCase(), code: m[2].toUpperCase() } : null;
}
function pickAdm(x) {
  const name = txt(x["행정규칙명"]).replace(/\s+/g, " ").trim();
  const c = codeOf(name);
  if (!c) return null;
  return {
    name,
    seq: txt(x["행정규칙일련번호"]),
    id: txt(x["행정규칙ID"]),
    eff: txt(x["시행일자"]),
    pub: txt(x["발령일자"]),
    no: txt(x["발령번호"]),
    kind: txt(x["행정규칙종류"]),
    org: txt(x["소관부처명"]),
    why: txt(x["제개정구분명"]),
    std: c.std,
    code: c.code,
    track: c.std === "NFTC" ? "t" : "p",
  };
}

// ---------- 색인(모든 설비·모든 판) ----------
let memIdx = null;
const IDX_KEY = "hfls:lawat:fsidx:v1";
async function fetchIndex() {
  const page = async (q, pg) => {
    const j = await lawJson("lawSearch.do", { target: "admrul", query: q, nw: "2", sort: "efasc", display: "100", page: String(pg) }, 15000);
    const s = j.AdmRulSearch || {};
    return { list: arr(s.admrul), total: +s.totalCnt || 0 };
  };
  const firsts = await Promise.all(Q.map((q) => page(q, 1)));
  const rest = [];
  Q.forEach((q, i) => {
    for (let pg = 2; (pg - 1) * 100 < firsts[i].total && pg <= 15; pg++) rest.push(page(q, pg));
  });
  const all = firsts.concat(await Promise.all(rest));
  const out = new Map();
  for (const r of all) for (const x of r.list) { const v = pickAdm(x); if (v && v.seq) out.set(v.seq, v); }
  return [...out.values()].sort(byEff);
}
const byEff = (a, b) => (a.eff !== b.eff ? (a.eff < b.eff ? -1 : 1) : a.pub !== b.pub ? (a.pub < b.pub ? -1 : 1) : +a.seq - +b.seq);
async function loadIndex() {
  if (memIdx && Date.now() - memIdx.at < 6 * 3600 * 1000) return memIdx.list;
  if (configured()) {
    try {
      const [raw] = await pipeline([["GET", IDX_KEY]]);
      if (raw) { const list = JSON.parse(raw); memIdx = { at: Date.now(), list }; return list; }
    } catch (e) { /* 캐시 실패는 무시 */ }
  }
  const list = await fetchIndex();
  if (!list.length) throw new Error("화재안전기준 목록을 받지 못함");
  memIdx = { at: Date.now(), list };
  if (configured()) {
    try { await pipeline([["SET", IDX_KEY, JSON.stringify(list), "EX", 60 * 60 * 24]]); } catch (e) { /* 무시 */ }
  }
  return list;
}

/** 설비 번호의 모든 판(같은 행정규칙ID 계열 전체, 시행일 순) */
function chainOf(idx, code) {
  const ids = new Set(idx.filter((x) => x.code === code).map((x) => x.id));
  return idx.filter((x) => ids.has(x.id)).sort(byEff);
}
/** 기준일에 시행 중이던 판. ty: "p"(성능·NFSC) | "t"(기술 NFTC) | ""(자동: NFTC가 있으면 NFTC) */
function resolve(chain, date, ty) {
  const at = (track) => {
    const vs = chain.filter((v) => v.track === track);
    let cur = null;
    for (const v of vs) if (v.eff <= date) cur = v;
    const next = vs.find((v) => v.eff > date) || null;
    return { cur, next };
  };
  const t = at("t");
  let track = ty === "p" ? "p" : ty === "t" ? "t" : t.cur ? "t" : "p";
  let note = "";
  if (track === "t" && !t.cur) {
    track = "p";
    note = `기술기준(NFTC)은 ${chain.some((v) => v.track === "t") ? "이 날짜에 아직 없음" : "이 설비에 없음"} — 2022.12.1. 전에는 화재안전기준(NFSC) 하나뿐이므로 NFSC를 보여 줍니다.`;
  }
  const r = track === "t" ? t : at("p");
  return { ...r, track, note };
}

// ---------- 원문 ----------
const joLabel = (k) => (k.includes("-") ? `제${k.split("-")[0]}조의${k.split("-")[1]}` : `제${k}조`);
/** 붙어서 오는 항·호·목을 줄 바꿈 */
function fmtArt(s) {
  return String(s)
    .replace(/(\S)\s*([①-⑳])/g, "$1\n$2")
    .replace(/(다\.|\.\)|:|”|")\s*(?=(?:\d{1,2}|[가-하])\.\s?[^\d\s])/g, "$1\n")
    .replace(/(다\.)\s*(?=\(\d{1,2}\)|\d{1,2}\))/g, "$1\n")
    .trim();
}
/** NFTC 긴 글 → 줄 바꿈(1.1.1 같은 하위 번호 앞) */
function fmtTech(s) {
  return String(s)
    .replace(/(?<=[^\d.\s~,·ㆍ및(]|[^\d]\.)(?=\d{1,2}\.\d{1,2}\.\d{1,2}(?:\.\d{1,2})*\s)/g, "\n")
    .replace(/(다\.|:)\s*(?=\(\d{1,2}\)\s)/g, "$1\n")
    .replace(/([^\s(\d조항호])(?=\(\d{1,2}\)\s)/g, "$1\n") // 붙어 오는 목록 「거실(2) 오피스텔」
    .replace(/\s*(\[표\s*\d)/g, "\n$1")
    .trim();
}
/** NFTC 본문(긴 글 하나)을 1.1·2.1 같은 절 단위로 나눔 — 번호가 차례로 이어지는 제목만 받음(본문 속 인용 번호는 건너뜀) */
function splitTech(s) {
  s = String(s || "");
  const heads = [];
  let a = 1;
  let b = 0;
  let from = 0;
  for (let guard = 0; guard < 400; guard++) {
    let best = null;
    for (const [x, y] of [[a, b + 1], [a + 1, 1]]) {
      const pat = `${x}.${y} `;
      let i = from;
      while ((i = s.indexOf(pat, i)) >= 0) {
        const okPrev = i === 0 || (!/\d/.test(s[i - 1]) && (s[i - 1] !== "." || !/\d/.test(s[i - 2] || "")));
        const sub = s.slice(i + pat.length, i + pat.length + 70).indexOf(`${x}.${y}.1 `);
        const title = sub > 0 ? s.slice(i + pat.length, i + pat.length + sub).trim() : "";
        // 제목은 짧은 이름(문장 끝 「다.」나 다른 번호가 끼면 본문 속 인용 번호)
        if (okPrev && title && !/다\.|\d\.\d/.test(title)) { if (!best || i < best.i) best = { i, x, y, title }; break; }
        i += pat.length;
      }
    }
    if (!best) break;
    heads.push(best);
    a = best.x;
    b = best.y;
    from = best.i + 1;
  }
  if (heads.length < 2) return [{ k: "1", head: false, label: "본문", text: fmtTech(s) }];
  const out = [];
  const pre = s.slice(0, heads[0].i).trim();
  if (pre) out.push({ head: true, label: pre.slice(0, 40) });
  heads.forEach((h, n) => {
    let body = s.slice(h.i, n + 1 < heads.length ? heads[n + 1].i : s.length);
    let top = "";
    const nx = heads[n + 1];
    if (nx && nx.x !== h.x) {
      // 다음 장 제목(「2. 기술기준」)이 이 절 끝에 붙어 있음 → 떼어 내 장 제목으로
      const j = body.lastIndexOf(`${nx.x}. `);
      if (j > 0 && body.length - j < 40 && !/\d/.test(body[j - 1]) && !/\d/.test(body[j - 2] || "")) { top = body.slice(j).trim(); body = body.slice(0, j); }
    }
    out.push({ k: `${h.x}.${h.y}`, head: false, label: `${h.x}.${h.y} ${h.title}`, text: fmtTech(body) });
    if (top) out.push({ head: true, label: top });
  });
  return out;
}
/** 별표 객체 → { k, title, text, links } */
function bylOf(o, n) {
  const guess = /별표\s*(\d+)(?:\s*의\s*(\d+))?/.exec(`${txt(o["별표제목"])} ${txt(o["별표내용"]).slice(0, 40)}`);
  const num = (v) => String(+String(v).replace(/\D/g, "") || "");
  let k = "별표번호" in o && num(o["별표번호"]) ? num(o["별표번호"]) + (+txt(o["별표가지번호"]) ? `-${+txt(o["별표가지번호"])}` : "") : guess ? guess[1] + (guess[2] ? `-${guess[2]}` : "") : String(n + 1);
  const links = {};
  if (o["별표서식PDF파일링크"]) links.pdf = absLink(o["별표서식PDF파일링크"]);
  if (o["별표서식파일링크"]) links.hwp = absLink(o["별표서식파일링크"]);
  return { k, title: txt(o["별표제목"]), text: txt(o["별표내용"]), links };
}
function collect(o, fn) {
  if (Array.isArray(o)) o.forEach((x) => collect(x, fn));
  else if (o && typeof o === "object") {
    if ("별표내용" in o || "별표제목" in o) fn(o);
    else for (const v of Object.values(o)) collect(v, fn);
  }
}
/** lawService.do(admrul) JSON → { info, arts, byls, files } */
function parseAdm(j) {
  const S = (j && (j.AdmRulService || Object.values(j)[0])) || {};
  const b = S["행정규칙기본정보"] || {};
  const info = { name: txt(b["행정규칙명"]).replace(/\s+/g, " "), eff: txt(b["시행일자"]), pub: txt(b["발령일자"]), no: txt(b["발령번호"]), kind: txt(b["행정규칙종류"]), org: txt(b["소관부처명"]), why: txt(b["제개정구분명"]) };
  const arts = [];
  const raw = S["조문내용"];
  const parts = Array.isArray(raw) ? raw.map(txt).filter(Boolean) : [];
  const one = Array.isArray(raw) ? (parts.length === 1 ? parts[0] : "") : txt(raw);
  const asArticles = (list) => {
    for (const s0 of list) {
      const s = s0.trim();
      const m = /^제\s*(\d+)\s*조(?:\s*의\s*(\d+))?\s*(?:\(([^)]*)\))?/.exec(s);
      if (m) {
        const k = m[2] ? `${+m[1]}-${+m[2]}` : String(+m[1]);
        arts.push({ k, head: false, label: `${joLabel(k)}${m[3] ? `(${m[3]})` : ""}`, text: fmtArt(s) });
      } else if (/^제\s*\d+\s*(장|절)/.test(s) || s.length <= 40) arts.push({ head: true, label: s.slice(0, 60) });
      else if (arts.length && !arts[arts.length - 1].head) arts[arts.length - 1].text += `\n${fmtArt(s)}`;
      else arts.push({ k: "본문", head: false, label: "본문", text: fmtArt(s) });
    }
  };
  if (parts.length > 1) asArticles(parts);
  else if (one) {
    const pieces = one.split(/(?=제\s*\d+\s*조(?:\s*의\s*\d+)?\s*\()/).filter((x) => x.trim());
    if (/^\s*제\s*1\s*조/.test(one) && pieces.length > 1) asArticles(pieces);
    else arts.push(...splitTech(one));
  }
  const bu = arr(S["부칙"]).map((x) => txt(x && typeof x === "object" ? x["부칙내용"] : x)).filter(Boolean).join("\n\n");
  if (bu) arts.push({ k: "부칙", head: false, label: "부칙", text: bu.replace(/(\S)\s*(?=제\s*\d+\s*조\s*\()/g, "$1\n").replace(/(\S)\s*(?=②|③|④)/g, "$1\n") });
  const byls = [];
  collect(S["별표"], (o) => { if (txt(o["별표구분"]) !== "서식") byls.push(bylOf(o, byls.length)); });
  const f = S["첨부파일"] || {};
  const names = arr(f["첨부파일명"]).map(txt);
  const files = arr(f["첨부파일링크"]).map((u, i) => ({ name: names[i] || `첨부 ${i + 1}`, url: absLink(u) })).filter((x) => x.url);
  return { info, arts, byls, files };
}
/** (v2.46.0 확인용) 법제처 행정규칙 본문 응답에 어떤 항목이 있는지 — 제·개정이유 항목이 있는지 보려고 씀. 키 이름과 「이유·개정문」 항목 앞부분만 돌려줌 */
async function admFields(seq) {
  const j = await lawJson("lawService.do", { target: "admrul", ID: seq }, 20000);
  const S = (j && (j.AdmRulService || Object.values(j)[0])) || {};
  const b = S["행정규칙기본정보"] || {};
  const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => /이유|개정문|제정문/.test(k)).map(([k, v]) => [k, (typeof v === "string" ? v : JSON.stringify(v)).slice(0, 1500)]));
  return { top: Object.keys(S), basic: Object.keys(b), reason: { ...pick(S), ...pick(b) } };
}
const mem = new Map();
async function loadAdm(seq) {
  const key = `hfls:lawat:adm:${seq}`;
  if (mem.has(key)) return mem.get(key);
  if (configured()) {
    try {
      const [raw] = await pipeline([["GET", key]]);
      if (raw) { const d = JSON.parse(raw); mem.set(key, d); return d; }
    } catch (e) { /* 무시 */ }
  }
  const d = parseAdm(await lawJson("lawService.do", { target: "admrul", ID: seq }, 20000));
  if (!d.arts.length && !d.byls.length) throw new Error("본문을 읽지 못함");
  if (mem.size > 30) mem.delete(mem.keys().next().value);
  mem.set(key, d);
  const s = JSON.stringify(d);
  if (configured() && s.length < 900000) {
    try { await pipeline([["SET", key, s, "EX", 60 * 60 * 24 * 30]]); } catch (e) { /* 무시 */ }
  }
  return d;
}

const admLink = (v) => `https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=${v.seq}`;
const admNo = (v) => `${v.org || ""}${v.kind} 제${String(v.no).replace(/^제|호$/g, "")}호`;
const dash = (s) => (/^\d{8}$/.test(String(s)) ? `${String(s).slice(0, 4)}-${String(s).slice(4, 6)}-${String(s).slice(6)}` : String(s || ""));
const admLine = (v) => `${v.name} [${admNo(v)}, ${dash(v.pub)} 발령, ${dash(v.eff)} 시행${v.why ? `, ${v.why}` : ""}]`;

module.exports = { STDS, STD_NAME, NOTES, FIRST, SPLIT, codeOf, pickAdm, normCode, loadIndex, chainOf, resolve, splitTech, fmtArt, fmtTech, parseAdm, loadAdm, admFields, admLink, admNo, admLine, _reset: () => { memIdx = null; mem.clear(); } };
