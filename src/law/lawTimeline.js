// ============================================================
// 기타 자료 › 법령 연혁 — 법령 체계(시기별 법률·시행령·시행규칙·설치기준 별표·기술기준)와
// 개정 연혁(법제처 연혁 목록 /api/lawat?list=1 + 시행령 설치기준 요약 AMENDMENTS) 정리
// ============================================================
import { AMENDMENTS } from "./sources";

/** 법령 체계 — 시기별. 번호·시행일은 법제처 연혁 목록(eflaw)으로 확인(2026.11.23.)
 *  설치기준 별표 번호: 법제처 연혁본 목차 — 2004.6.1.·2012.10.1. 별표4, 2013.3.1.·2016.2.1.·2022.11.30. 별표5, 2023.1.1. 별표4
 *  기술기준(소방법 시기): 2025년도 소방시설법령 해설서 「법령 연혁」(lawlinks.js FSA_HISTORY와 같은 근거) */
export const ERAS = [
  {
    id: "fireact",
    short: "소방법",
    from: "1958-06-10",
    to: "2004-05-29",
    law: "소방법",
    lawNo: "법률 제485호 제정(1958.3.11. 공포)",
    dec: "소방법 시행령",
    rule: "소방법 시행규칙",
    table: "시행령 별표 — 1992.7.28. 전부개정(제13701호)부터 건축법 용도분류 체계",
    std: [
      ["~1981", "소방법 시행령(설치기준과 함께 규정)"],
      ["1982~1993", "소방시설의 설치·유지 및 위험물제조소등시설의 기준등에 관한 규칙"],
      ["1993~2004.6.3.", "소방기술기준에 관한 규칙"],
    ],
    note: "이 사이트의 판정은 1992.7.28.부터(운영매뉴얼 「소방시설의 연도별 적용기준」)",
  },
  {
    id: "maint",
    short: "소방시설설치유지법",
    from: "2004-05-30",
    to: "2012-02-04",
    law: "소방시설설치유지및안전관리에관한법률",
    lawNo: "법률 제6895호 제정",
    dec: "같은 법 시행령(대통령령 제18404호 제정)",
    rule: "같은 법 시행규칙(행정자치부령 제240호, 2004.7.7. 시행)",
    table: "시행령 별표4(제15조)",
    std: [["2004.6.4.~", "화재안전기준(NFSC, 소방방재청 고시)"]],
    note: "소방법을 소방기본법·소방시설공사업법·소방시설설치유지법·위험물안전관리법으로 분법",
  },
  {
    id: "maint12",
    short: "소방시설 설치·유지법",
    from: "2012-02-05",
    to: "2016-01-20",
    law: "소방시설 설치·유지 및 안전관리에 관한 법률",
    lawNo: "법률 제11037호 일부개정",
    dec: "같은 법 시행령",
    rule: "같은 법 시행규칙",
    table: "시행령 별표4(제15조) → 2013.2.10.(제24304호)부터 별표5(제15조)",
    std: [["", "화재안전기준(NFSC)"]],
    note: "주택용소방시설·강화기준 특례 도입, 노유자 생활시설 구분",
  },
  {
    id: "prev",
    short: "화재예방소방시설법",
    from: "2016-01-21",
    to: "2022-11-30",
    law: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률",
    lawNo: "법률 제13062호 일부개정",
    dec: "같은 법 시행령",
    rule: "같은 법 시행규칙",
    table: "시행령 별표5(제15조)",
    std: [["", "화재안전기준(NFSC)"]],
    note: "법률 명칭에 「화재예방」 추가",
  },
  {
    id: "now",
    short: "소방시설법",
    from: "2022-12-01",
    to: "9999-12-31",
    law: "소방시설 설치 및 관리에 관한 법률",
    lawNo: "법률 제18522호 전부개정",
    dec: "같은 법 시행령(대통령령 제33004호 전부개정 → 현행 제36728호)",
    rule: "같은 법 시행규칙(행정안전부령 제360호 전부개정)",
    table: "시행령 별표4(제11조)",
    std: [["2022.12.1.~", "화재안전성능기준(NFPC, 소방청 고시) + 화재안전기술기준(NFTC, 국립소방연구원 공고)"]],
    note: "화재예방·소방안전관리 규정은 「화재의 예방 및 안전관리에 관한 법률」로 분리",
  },
];

export const ymd = (s) => String(s || "").replace(/-/g, "");
export const dot = (s) => {
  const d = ymd(s);
  if (d === "99991231") return "현재";
  return /^\d{8}$/.test(d) ? `${d.slice(0, 4)}.${+d.slice(4, 6)}.${+d.slice(6)}.` : String(s || "");
};

/** 시행일 → 시기. 폐지(타법폐지) 판은 그 법령이 속한 앞 시기로 */
export function eraOf(v) {
  const e = ymd(v.eff);
  let i = ERAS.findIndex((x) => e >= ymd(x.from) && e <= ymd(x.to));
  if (i < 0) i = e < ymd(ERAS[0].from) ? 0 : ERAS.length - 1;
  if (/폐지/.test(v.why || "") && i > 0) i -= 1;
  return ERAS[i].id;
}

const digits = (s) => String(s || "").replace(/\D/g, "").replace(/^0+/, "");
const isStdNote = (a) => /고시/.test(a.no); // 시행령 요약에 섞인 화재안전기준 항목

/** 시행령 설치기준 요약(AMENDMENTS)을 법제처 목록에 붙임 — 번호가 같으면 그 판, 번호가 없으면 같은 시행일의 타법개정 아닌 판.
 *  목록에 없는 시행일(부칙으로 나중에 시행된 별표 등)은 「부칙 시행」 줄로 추가 */
export function mergeDecree(versions, amend = AMENDMENTS) {
  const rows = versions.map((v) => ({ ...v, notes: [] }));
  const extra = [];
  for (const a of amend.filter((x) => !isStdNote(x))) {
    const eff = ymd(a.eff);
    const no = digits(a.no);
    const same = rows.filter((r) => ymd(r.eff) === eff);
    let hit = no ? same.find((r) => digits(r.no) === no) : null;
    if (!hit && !no) hit = same.find((r) => !/타법/.test(r.why || "")) || null;
    if (hit) hit.notes.push(a);
    else {
      const base = no ? rows.find((r) => digits(r.no) === no) : null;
      extra.push({ name: base ? base.name : "", eff, pub: ymd(a.pub) || (base && base.pub) || "", no: no || "", kind: base ? base.kind : "대통령령", why: "부칙 시행", mst: "", notes: [a], synth: true });
    }
  }
  return [...rows, ...extra];
}

/** 화재안전기준 쪽 요약(예: 2022.9.8. 피난기구 NFSC 301) — std 번호별 */
export function stdNotes(code, amend = AMENDMENTS) {
  return amend.filter((a) => isStdNote(a) && new RegExp(`NFSC ${code}\\b`).test(a.text));
}

const MAJOR = /제정|전부개정|일부개정|부칙/;
/** 보기 거르기 — major: 타법개정·타법폐지 숨김, era: 시기, track: p(고시)|t(공고) */
export function filterRows(rows, { major = true, era = "", track = "", asc = false } = {}) {
  const out = rows.filter((r) => (!major || MAJOR.test(r.why || "") || (r.notes && r.notes.length)) && (!era || eraOf(r) === era) && (!track || r.track === track));
  return out.sort((a, b) => {
    const k = ymd(a.eff).localeCompare(ymd(b.eff)) || ymd(a.pub).localeCompare(ymd(b.pub)) || +digits(a.no) - +digits(b.no);
    return asc ? k : -k;
  });
}

export const isFuture = (r, today) => ymd(r.eff) > ymd(today);

export const lawLink = (v) => (v.seq ? `https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=${v.seq}` : v.mst ? `https://www.law.go.kr/lsInfoP.do?lsiSeq=${v.mst}&efYd=${ymd(v.eff)}` : "");
export const noText = (v) => {
  const n = String(v.no || "").replace(/^0+(?=\d)/, "");
  if (!n) return v.kind || "";
  return `${v.seq ? v.org || "" : ""}${v.kind ? v.kind + " " : ""}제${n}호`;
};
