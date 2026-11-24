// ============================================================
// 기타 자료 › 용어 정의 — 법령·화재안전성능기준의 「정의」 조문을 용어별로 나눔
//  원문: /api/lawat?defs=…(법제처 국가법령정보 OPEN API 현행 조문) — 서버는 「(정의)」 조문 원문만 돌려주고 여기서 나눔
//  출처 표기: 법령명 + 제N조(제N항)제N호(가목) — 항 표시(①)가 없는 조문은 항을 적지 않음
// ============================================================

/** 법령 계열(서버 FAMS 키) — 화면 표시 순서·짧은 이름 */
export const DEF_FAMS = [
  ["fire", "소방시설법"],
  ["prevent", "화재예방법"],
  ["work", "소방시설공사업법"],
  ["basic", "소방기본법"],
  ["haz", "위험물안전관리법"],
  ["multi", "다중이용업소법"],
  ["build", "건축법"],
];
export const KIND_NAME = { law: "법률", dec: "시행령", rule: "시행규칙" };

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
const TERM = /^["“]([^"”]{1,60})["”]\s*(\([^)]{1,40}\))?\s*(?:이)?란\s*/;
const ITEM = /^(\d+)(?:의(\d+))?\.\s*(.*)$/;
const MOK = /^([가-하])\.\s*(.*)$/;

const joOf = (label) => {
  const m = /제\s*(\d+)\s*조(?:\s*의\s*(\d+))?/.exec(label || "");
  return m ? `제${m[1]}조${m[2] ? `의${m[2]}` : ""}` : "";
};

/**
 * 정의 조문 하나 → [{ term, alias, text, ref }]
 *  text: 그 호의 전체 문장(딸린 목 포함, 줄바꿈 유지) / 목에 따로 정의가 있으면 그 목도 한 건으로
 */
export function parseDefArticle(label, text) {
  const jo = joOf(label);
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const multiHang = lines.some((l) => CIRCLED.includes(l[0]) && CIRCLED.indexOf(l[0]) > 0);
  const out = [];
  let hang = 1;
  let cur = null; // 지금 모으는 호(정의)
  const close = () => {
    if (cur) out.push(cur, ...(cur.subs || []));
    cur = null;
  };
  const refOf = (ho, mok) => `${jo}${multiHang ? `제${hang}항` : ""}${ho ? `제${ho}호` : ""}${mok ? `${mok}목` : ""}`;
  lines.forEach((raw, i) => {
    let l = raw;
    if (i === 0) l = l.replace(/^제\s*\d+\s*조(?:\s*의\s*\d+)?\s*\([^)]*\)\s*/, ""); // 「제2조(정의)」 머리
    if (CIRCLED.includes(l[0])) {
      close();
      hang = CIRCLED.indexOf(l[0]) + 1;
      l = l.slice(1).trim();
      // 항 자체가 한 문장 정의(「① 이 법에서 "○○"란 …」)
      const m = /^(?:이\s*(?:법|영|규칙|기준)에서\s*)?(["“][^"”]+["”].*)$/.exec(l);
      const t = m && TERM.exec(m[1]);
      if (t) cur = { term: t[1].trim(), alias: t[2] ? t[2].slice(1, -1) : "", text: m[1], ref: refOf("", "") };
      return;
    }
    let m = ITEM.exec(l);
    if (m) {
      close();
      const ho = m[2] ? `${m[1]}의${m[2]}` : m[1];
      const t = TERM.exec(m[3]);
      if (t && !/^삭제/.test(m[3])) cur = { term: t[1].trim(), alias: t[2] ? t[2].slice(1, -1) : "", text: m[3], ref: refOf(ho, ""), ho };
      return;
    }
    m = MOK.exec(l);
    if (m && cur) {
      cur.text += `\n${l}`;
      const t = TERM.exec(m[2]);
      if (t) (cur.subs = cur.subs || []).push({ term: t[1].trim(), alias: t[2] ? t[2].slice(1, -1) : "", text: m[2], ref: refOf(cur.ho, m[1]), parent: cur.term });
      return;
    }
    if (cur) cur.text += `\n${l}`; // 이어지는 줄(1) 2) 등)
  });
  close();
  return out.map(({ ho, subs, ...d }) => d);
}

/** 서버 응답(defs=계열) → 정의 목록 */
export function defsFromFam(res, famLabel) {
  const list = [];
  for (const it of (res && res.items) || []) {
    if (!it.ver || !it.arts) continue;
    for (const a of it.arts) {
      for (const d of parseDefArticle(a.label, a.text)) {
        list.push({ ...d, law: it.ver.name, src: `${it.ver.name} ${d.ref}`, group: famLabel, kind: it.kind, eff: it.ver.eff, link: it.link });
      }
    }
    for (const b of it.byls || []) {
      const ref = bylRef(b);
      for (const term of b.terms || []) list.push({ term, alias: b.alias || "", text: b.text, ref, law: it.ver.name, src: `${it.ver.name} ${ref}`, group: "별표", fam: famLabel, kind: it.kind, eff: it.ver.eff, link: it.link });
    }
  }
  return list;
}

/** 별표 정의 위치 — 「[별표 1] 제2호(소방시설공사업) 비고 제6호」 */
export function bylRef(b) {
  const no = (x) => {
    const m = /^(\d+)\.$/.exec(x || "");
    if (m) return `제${m[1]}호`;
    const k = /^([가-하])\.$/.exec(x || "");
    return k ? `${k[1]}목` : x || "";
  };
  const sec = /^(\d+)\.\s*(.+)$/.exec(b.section || "");
  return [`[별표 ${String(b.byl).replace(/-/g, "의")}]`, sec ? `제${sec[1]}호(${sec[2]})` : "", b.bigo ? "비고" : "", no(b.no)].filter(Boolean).join(" ");
}

/** 사용자 정리분(DEF_EXTRA)이 있으면 같은 출처·용어의 자동 추출분 대신 씀(줄바꿈 정리본) */
export function mergeExtra(list, extra) {
  const key = (d) => `${d.src}|${d.term}`;
  const have = new Set(extra.map(key));
  return [...list.filter((d) => !have.has(key(d))), ...extra];
}

/** 서버 응답(defs=std) → 정의 목록 */
export function defsFromStd(res) {
  const list = [];
  for (const it of (res && res.items) || []) {
    if (!it.ver || !it.arts) continue;
    for (const a of it.arts) {
      for (const d of parseDefArticle(a.label, a.text)) {
        list.push({ ...d, law: it.ver.name, src: `${it.ver.name} ${d.ref}`, group: "화재안전성능기준", kind: "std", std: it.std, eff: it.ver.eff, link: it.link });
      }
    }
  }
  return list;
}

const norm = (s) => String(s || "").replace(/[\s·ㆍ・()（）「」"“”]/g, "").toLowerCase();

/** 검색 — 용어가 같으면 먼저, 용어에 들어 있으면 다음, (본문 검색을 켜면) 정의 문장에 들어 있으면 마지막 */
export function searchDefs(list, q, { body = false, group = "" } = {}) {
  const k = norm(q);
  const pool = group ? list.filter((d) => d.group === group || d.fam === group) : list; // 법 묶음엔 그 법의 별표 정의도
  if (!k) return pool;
  const scored = [];
  for (const d of pool) {
    const t = norm(d.term) + (d.alias ? `|${norm(d.alias)}` : "");
    let s = 0;
    if (norm(d.term) === k || norm(d.alias) === k) s = 3;
    else if (t.includes(k)) s = 2;
    else if (body && norm(d.text).includes(k)) s = 1;
    if (s) scored.push([s, d]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].term.length - b[1].term.length).map((x) => x[1]);
}
