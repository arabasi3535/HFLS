// ============================================================
// 안전관리 검토 — 소방안전관리대상물 등급 · 방염 대상 · 소방자동차 전용구역 대상
//
//  ※ 판정 기준일
//   - 소방안전관리대상물 등급: 현행 화재예방법 시행령 별표4로 판정.
//     2·3급의 '…설비를 설치해야 하는 특정소방대상물'은 이 건축물에 실제 적용되는 설치 의무로 판단
//     (기존 건축물 = 건축허가등 신청일 당시 기준 + 부칙 소급 + 강화기준 적용분).
//     현행 기준이 강화됐지만 소급하지 않은 시설은 넣지 않음(예: 교육연구시설 자탐 1,000→2,000㎡ — 소급 안 했으면 일반).
//     소급·강화기준으로 현행 시설을 갖추게 했다면 그 시설로 현행 등급 부여. (운영 기준: 관리자 판단 2026.11.8.)
//   - 방염: 현행 시행령 제30조로 판정하되, 개정 부칙 적용례상 소급하지 않은 대상(치과의원·한의원 등)은 따로 표시.
//   - 소방자동차 전용구역: 법률 제15365호 부칙 제2조 — 2018.8.10. 이후 최초로 주택건설사업계획 승인
//     또는 건축허가를 '신청'하는 공동주택부터 적용(신청일 기준).
//
//  cert(검증등급): V = 원문 확인, U = 원문 대조 전(관리자 검증 필요)
// ============================================================
import { STATUS } from "./engine";
import { num } from "./logic";

export const S = { YES: "대상", NO: "비대상", CHK: "확인 필요", NA: "해당없음" };

/** 근거 법령 표기 */
export const SAFETY_REFS = {
  grade: "화재의 예방 및 안전관리에 관한 법률 제24조제1항, 같은 법 시행령 제25조제1항·[별표4]",
  flame: "소방시설 설치 및 관리에 관한 법률 제20조제1항, 같은 법 시행령 제30조",
  flameItems: "방염대상물품: 소방시설법 시행령 제31조",
  lane: "소방기본법 제21조의2, 같은 법 시행령 제7조의12",
  laneHow: "설치 기준·방법: 소방기본법 시행령 제7조의13, [별표2의5]",
  laneBuchik: "소방기본법 부칙(법률 제15365호, 2018.2.9.) 제2조",
  laneExc: "소방기본법 시행령 부칙(대통령령 제31666호, 2021.5.4.) 제2조",
};

/** 소방자동차 전용구역 규정 시행일 (법률 제15365호, 2018.2.9. 공포 · 2018.8.10. 시행) */
export const LANE_FROM = "2018-08-10";
/** 시행 직후 구간: 건축물대장 '허가일'만으로는 '신청일'이 시행일 전인지 알 수 없음 → 신청일 확인 */
const LANE_ASK_UNTIL = "2019-01-01";

const fmtN = (n) => Number(n).toLocaleString("ko-KR");

/**
 * 방염 대상 확대 개정 중 소급하지 않은 대상(개정 부칙 적용례) — 결과에 「소급 없음」 표시
 *  - 치과의원·한의원: 대통령령(2024.12.31. 개정) 부칙 제3조 — 시행 이후 설치(교체 포함)분부터 (관리자 확인)
 *  - 조산원·산후조리원: 개정 부칙 — 시행 이후 교체하는 경우에도 적용 (산후조리원은 다중이용업으로 이미 대상)
 *  - 의원·공연장·종교집회장·병원·치과병원·한방병원·격리병원 / 요양병원 / 합숙소: 시행 이후 설치분부터
 *  ※ 치과의원·한의원 외 개정 시행일은 연혁본 확인 후 기재(국가법령정보센터 제·개정문 부칙 적용례 확인)
 */
const NO_RETRO = {
  dentalOriental: "소급 없음 — 2024.12.31. 이후 실내장식물 등을 설치(교체 포함)하는 경우부터",
  midwife: "소급 없음 — 개정 시행 이후 설치하거나 기존 물품을 교체하는 경우부터",
  clinic: "소급 없음 — 개정 시행 이후 실내장식물 등을 설치하는 경우부터",
  perfReligion: "소급 없음 — 개정 시행 이후 실내장식물 등을 설치하는 경우부터",
  hosp: "병원·치과병원·한방병원·격리병원은 소급 없음 — 개정 시행 이후 설치분부터(종합병원 제외)",
  nursing: "소급 없음 — 개정 시행 이후 요양병원에 실내장식물 등을 설치하는 경우부터",
  hapsuk: "소급 없음 — 개정 시행 후 합숙소에 실내장식물 등을 설치하는 경우부터",
};

/** 시설 상태 → 3값 (설치=true, 해당없음=false, 연혁 확인·확인 필요=null) */
function facTri(row) {
  if (!row) return false;
  if (row.status === STATUS.REQ) return true;
  if (row.status === STATUS.NONE) return false;
  return null;
}

/**
 * 등급 판정에 쓰는 '설치해야 하는 설비' 사실값
 *  = 현행 기준(curr)으로 설치 대상이고, 실제로 설치 의무가 생긴 것(허가 당시 기준 hist 또는 부칙 소급·강화기준 applied)
 *   · 완화(예: 교육연구시설 자탐 1,000→2,000㎡): 당시 설치했어도 현행 기준 미대상이면 제외 → 등급 하향(일반)
 *   · 강화 후 소급 안 함: 시설이 없으므로 제외 / 소급·강화기준 적용: 포함 → 현행 등급
 *  applied: Map(key → true|null)
 */
function facFacts(hist, curr, applied = new Map()) {
  const t = (k) => {
    const c = facTri(curr.byKey[k]);
    const h = facTri(hist.byKey[k]);
    const a = applied.has(k) ? applied.get(k) : false;
    const inst = h === true || a === true ? true : h === null || a === null ? null : false;
    if (c === false || inst === false) return false;
    if (c === true && inst === true) return true;
    return null;
  };
  // 주택전용 간이스프링클러설비(연립·다세대)는 3급 기준에서 제외
  let sspk = t("sspk");
  if (sspk === true) {
    const r = curr.byKey.sspk;
    const ids = [...r.hits, ...r.maybes].map((i) => i.id);
    if (ids.length && ids.every((id) => id === "sspk-row")) sspk = false;
  }
  return { hydrant: t("hydrant"), spk: t("spk"), water: t("water"), sspk, afd: t("afd") };
}

/** 「공동주택관리법」 제2조제1항제2호 의무관리대상 공동주택 (3값) */
function mandatoryManaged(u, f) {
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  if (!g("apt", "row", "multi", "mixed_res")) return { v: false };
  const hh = num(f.households);
  if (f.mmConsent) return { v: true, why: "입주자등 동의로 정한 공동주택(마목)" };
  if (hh === null) return { v: null, why: "세대수 미입력" };
  if (hh >= 300) return { v: true, why: `${fmtN(hh)}세대 — 300세대 이상(가목)` };
  if (hh >= 150 && f.elevator) return { v: true, why: `${fmtN(hh)}세대 — 150세대 이상 + 승강기(나목)` };
  if (hh >= 150 && f.centralHeat) return { v: true, why: `${fmtN(hh)}세대 — 150세대 이상 + 중앙집중식·지역난방(다목)` };
  if (hh >= 150 && g("mixed_res")) return { v: true, why: `주택 ${fmtN(hh)}세대 — 주택 외 시설과 동일 건축물, 150세대 이상(라목)` };
  return { v: false, why: `${fmtN(hh)}세대` };
}

/** 높이(m) 기준: 입력값 우선, 미입력 시 지상 20층 미만은 120m 미만으로 봄(가정 표시) */
function heightGE(h, gf, t, notes) {
  if (h !== null) return h >= t;
  if (gf < 20) {
    if (gf >= 11)
      notes.add("건축물 높이 미입력 — 지상 20층 미만은 높이 120m 미만으로 보고 판정했습니다(층고가 높은 건축물은 높이를 입력하십시오).");
    return false;
  }
  return null;
}

/**
 * 한 등급 기준 집합을 평가 → { hit: [..], unk: [..] }
 */
function evalList(list) {
  const hit = [];
  const unk = [];
  for (const c of list) {
    if (c.v === true) hit.push(c);
    else if (c.v === null) unk.push(c);
  }
  return { hit, unk };
}

function gradeFrom(rv, facts) {
  const input = rv.input;
  const u = rv.use;
  const f = input.f || {};
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  const notes = new Set();
  const gf = num(input.gf) ?? 0;
  const bf = num(input.bf) ?? 0;
  const area = num(input.area);
  const h = num(f.height);
  const gasTon = num(f.gasTon);
  const apt = g("apt");

  // 특급·1급 범위에서 제외되는 대상물(별표4 비고): 동·식물원, 철강 등 불연성 물품 저장·취급 창고, 위험물 제조소등, 지하구
  const ex1 = g("zoo") || (g("warehouse") && !!f.nonCombustibleStore) || u.id === "hazmat" || g("ugduct");

  const or3 = (...xs) => (xs.some((x) => x === true) ? true : xs.some((x) => x === null) ? null : false);
  const areaGE = (t) => (area === null ? null : area >= t);

  const top = [
    apt && { text: "50층 이상(지하층 제외)이거나 지상으로부터 높이 200m 이상인 아파트", v: or3(gf >= 50, heightGE(h, gf, 200, notes)), basis: `지상 ${gf}층${h !== null ? ` · 높이 ${fmtN(h)}m` : ""}` },
    !apt && { text: "30층 이상(지하층 포함)이거나 지상으로부터 높이 120m 이상(아파트 제외)", v: or3(gf + bf >= 30, heightGE(h, gf, 120, notes)), basis: `지하 포함 ${gf + bf}층${h !== null ? ` · 높이 ${fmtN(h)}m` : ""}` },
    !apt && { text: "연면적 10만㎡ 이상(아파트 제외)", v: areaGE(100000), basis: `연면적 ${area === null ? "미입력" : fmtN(area) + "㎡"}` },
  ].filter(Boolean);

  const one = [
    apt && { text: "30층 이상(지하층 제외)이거나 지상으로부터 높이 120m 이상인 아파트", v: or3(gf >= 30, heightGE(h, gf, 120, notes)), basis: `지상 ${gf}층${h !== null ? ` · 높이 ${fmtN(h)}m` : ""}` },
    !apt && !g("row") && { text: "연면적 1만5천㎡ 이상(아파트·연립주택 제외)", v: areaGE(15000), basis: `연면적 ${area === null ? "미입력" : fmtN(area) + "㎡"}` },
    !apt && { text: "지상층의 층수가 11층 이상(아파트 제외)", v: gf >= 11, basis: `지상 ${gf}층` },
    g("gas", "factory", "warehouse") && { text: "가연성 가스를 1천톤 이상 저장·취급하는 시설", v: gasTon === null ? (g("gas") ? null : false) : gasTon >= 1000, basis: `가연성 가스 ${gasTon === null ? "미입력" : fmtN(gasTon) + "톤"}` },
  ].filter(Boolean);

  const waterNote = facts.water === true ? " (호스릴 방식 물분무등소화설비만 설치하는 경우는 제외)" : "";
  const two = [
    { text: "옥내소화전설비·스프링클러설비·물분무등소화설비[호스릴 방식만 설치한 경우 제외]를 설치해야 하는 대상물", v: or3(facts.hydrant, facts.spk, facts.water), basis: [facts.hydrant === true && "옥내소화전", facts.spk === true && "스프링클러", facts.water === true && "물분무등" + waterNote].filter(Boolean).join(" · ") || "해당 설비 판정 결과" },
    g("gas", "factory", "warehouse") && {
      text: "가스 제조설비를 갖추고 도시가스사업 허가를 받아야 하는 시설 또는 가연성 가스 100톤 이상 1천톤 미만 저장·취급 시설",
      v: f.cityGas ? true : gasTon === null ? (g("gas") ? null : false) : gasTon >= 100 && gasTon < 1000,
      basis: f.cityGas ? "도시가스사업 허가 대상 가스 제조설비" : `가연성 가스 ${gasTon === null ? "미입력" : fmtN(gasTon) + "톤"}`,
    },
    g("ugduct") && { text: "지하구", v: true, basis: u.name },
    g("apt", "row", "multi", "mixed_res") && (() => {
      const m = mandatoryManaged(u, f);
      return { text: "「공동주택관리법」 제2조제1항제2호에 따른 의무관리대상 공동주택", v: m.v, basis: m.why };
    })(),
    g("heritage") && { text: "보물 또는 국보로 지정된 목조건축물", v: true, basis: u.name },
  ].filter(Boolean);

  const three = [
    { text: "간이스프링클러설비(주택전용 간이스프링클러설비 제외)를 설치해야 하는 대상물", v: facts.sspk, basis: "간이스프링클러설비 판정 결과" },
    { text: "자동화재탐지설비를 설치해야 하는 대상물", v: facts.afd, basis: "자동화재탐지설비 판정 결과" },
  ];

  const levels = [
    { grade: "특급", ...(ex1 ? { hit: [], unk: [] } : evalList(top)) },
    { grade: "1급", ...(ex1 ? { hit: [], unk: [] } : evalList(one)) },
    { grade: "2급", ...evalList(two) },
    { grade: "3급", ...evalList(three) },
  ];
  if (ex1) notes.add("동·식물원, 철강 등 불연성 물품 저장·취급 창고, 위험물 제조소등, 지하구는 특급·1급 소방안전관리대상물에서 제외됩니다(별표4 비고).");
  if (u.id === "hazmat") notes.add("위험물 제조소등은 「위험물안전관리법」에 따른 위험물안전관리자 선임 대상 — 소방안전관리대상물 해당 여부를 함께 확인하십시오.");
  if (g("apt", "row", "multi", "mixed_res")) notes.add("의무관리대상 공동주택 세대수는 공동주택(단지) 전체 세대수 기준입니다.");

  const first = levels.findIndex((l) => l.hit.length);
  const higherUnk = levels.slice(0, first === -1 ? 4 : first).filter((l) => l.unk.length);
  let grade = first === -1 ? "" : levels[first].grade;
  let status = first === -1 ? (higherUnk.length ? S.CHK : S.NO) : higherUnk.length ? S.CHK : S.YES;
  return { grade, status, levels, first, higherUnk, notes: [...notes] };
}

/**
 * 소방안전관리대상물 등급
 *  applied: 결과 화면의 최종 설치 목록(부칙 소급·강화기준 선택 반영) — Map(key → true|null). 없으면 부칙 소급 의무 전부 반영
 */
export function fireSafetyGrade(rv, mode, applied) {
  const u = rv.use;
  const f = rv.input.f || {};
  if (u.g.includes("house")) {
    return { status: S.NA, grade: "", summary: "단독주택 — 특정소방대상물이 아니므로 소방안전관리대상물에 해당하지 않습니다.", levels: [], notes: [], ref: SAFETY_REFS.grade };
  }
  if (f.publicOrg) {
    return {
      status: S.NA,
      grade: "",
      summary: "「공공기관의 소방안전관리에 관한 규정」을 적용받는 특정소방대상물 — 소방안전관리대상물에서 제외(같은 규정에 따라 소방안전관리자 선임).",
      levels: [],
      notes: [],
      ref: SAFETY_REFS.grade,
    };
  }
  const existing = mode === "existing";
  let extra = applied;
  if (!extra) {
    extra = new Map();
    if (existing) for (const r of rv.retro) for (const a of r.atStatus) if (a.st === STATUS.REQ || a.st === STATUS.REQ_CHK) extra.set(a.k, a.st === STATUS.REQ ? true : null);
  }
  const main = gradeFrom(rv, facFacts(rv.hist, rv.curr, extra));
  let alt = null; // 현행 기준 시설을 모두 갖춘 경우(강화기준 전부 적용 가정)
  let past = null; // 허가 당시 기준 시설 그대로인 경우(완화 전 등급)
  if (existing) {
    const c = gradeFrom(rv, facFacts(rv.curr, rv.curr));
    if (c.grade !== main.grade || c.status !== main.status) alt = c;
    const p = gradeFrom(rv, facFacts(rv.hist, rv.hist, extra));
    if (p.grade !== main.grade || p.status !== main.status) past = p;
  }
  const label = (r) => (r.grade ? `${r.grade} 소방안전관리대상물` : "소방안전관리대상물 아님");
  let summary = label(main);
  if (main.status === S.CHK) {
    const up = main.higherUnk.map((l) => l.grade).join("·");
    summary = main.grade ? `${main.grade} 이상 — ${up} 해당 여부 확인 필요` : `${up} 해당 여부 확인 필요`;
  }
  const notes = [...main.notes];
  if (alt) {
    notes.unshift(
      `현행 기준 시설을 모두 갖추면 「${alt.status === S.CHK ? "확인 필요" : label(alt)}」입니다. 강화됐지만 소급하지 않은 시설은 없는 것으로 보고 빼며, 부칙 소급·강화기준으로 갖추게 했다면 등급에 반영합니다(위 「강화기준 적용」 선택 시 자동 반영).`
    );
  }
  if (past) {
    notes.unshift(
      `허가 당시 기준으로는 「${past.status === S.CHK ? "확인 필요" : label(past)}」이었으나, 현행 기준에서 설치 대상이 아닌(완화된) 시설은 '설치해야 하는 설비'로 보지 않아 위와 같이 판정했습니다.`
    );
  }
  if (existing && rv.retro.length) notes.push("부칙 소급(의무) 시설 중 반영한 것은 '설치해야 하는 설비'에 포함해 판정했습니다.");
  return { status: main.status, grade: main.grade, summary, levels: main.levels, first: main.first, notes, alt, ref: SAFETY_REFS.grade };
}

/** 방염성능기준 이상의 실내장식물 등을 설치해야 하는 특정소방대상물 (현행 시행령 제30조) */
export function flameRetardant(rv, mode) {
  const u = rv.use;
  const f = rv.input.f || {};
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  const gf = num(rv.input.gf) ?? 0;
  const hits = [];
  const checks = [];
  const notes = [];
  if (g("house")) return { status: S.NA, hits, checks, notes: ["단독주택은 특정소방대상물이 아닙니다."], ref: SAFETY_REFS.flame };
  if (g("row", "multi") && rv.hist.rowGap) notes.push("2024.12.1. 전 허가 연립·다세대주택 — 특정소방대상물 해당 여부를 먼저 확인하십시오.");

  // 제1호 근린생활시설 중 의원·치과의원·한의원·조산원·산후조리원·체력단련장·공연장·종교집회장
  if (g("clinic")) {
    if (f.clinicType === "dental" || f.clinicType === "oriental") {
      hits.push({ no: "제1호", text: `근린생활시설 중 ${f.clinicType === "dental" ? "치과의원" : "한의원"}`, scope: "해당 시설", noRetro: NO_RETRO.dentalOriental });
    } else if (f.clinicType === "clinic") {
      hits.push({ no: "제1호", text: "근린생활시설 중 의원", scope: "해당 시설", noRetro: NO_RETRO.clinic });
    } else {
      hits.push({ no: "제1호", text: "근린생활시설 중 의원·치과의원·한의원", scope: "해당 시설", noRetro: NO_RETRO.dentalOriental });
      checks.push({ no: "제1호", text: "의원/치과의원/한의원 구분 — 치과의원·한의원은 2024.12.31. 이후 설치·교체분부터 적용" });
    }
  }
  if (g("midwife")) {
    if (f.midwifeType === "postnatal") {
      hits.push({ no: "제1호", text: "근린생활시설 중 산후조리원", scope: "해당 시설" });
      notes.push("산후조리원은 다중이용업(산후조리업) 영업소 — 제9호에도 해당합니다.");
    } else if (f.midwifeType === "midwife") hits.push({ no: "제1호", text: "근린생활시설 중 조산원", scope: "해당 시설", noRetro: NO_RETRO.midwife });
    else hits.push({ no: "제1호", text: "근린생활시설 중 조산원·산후조리원", scope: "해당 시설", noRetro: NO_RETRO.midwife });
  }
  if (g("neigh") && f.neighFlame) {
    const nf = f.neighFlame === "gym" ? "체력단련장" : f.neighFlame === "perf" ? "공연장" : f.neighFlame === "religion" ? "종교집회장" : "체력단련장·공연장·종교집회장";
    hits.push({ no: "제1호", text: `근린생활시설 중 ${nf}`, scope: "해당 시설", noRetro: f.neighFlame === "perf" || f.neighFlame === "religion" ? NO_RETRO.perfReligion : undefined });
  }
  // 제2호 건축물의 옥내에 있는 문화 및 집회시설·종교시설·운동시설(수영장 제외)
  if (g("culture", "religion", "sports")) {
    if (f.outdoorFacility) notes.push("건축물 옥내에 있지 않은 시설 — 제2호 비대상.");
    else if (g("sports") && f.poolOnly) notes.push("운동시설 중 수영장 — 제2호에서 제외.");
    else hits.push({ no: "제2호", text: `건축물의 옥내에 있는 ${g("sports") ? "운동시설(수영장 제외)" : g("religion") ? "종교시설" : "문화 및 집회시설"}`, scope: "해당 시설" });
  }
  // 제3호 의료시설
  if (g("medical")) hits.push({ no: "제3호", text: "의료시설", scope: "해당 시설", noRetro: g("nursing") ? NO_RETRO.nursing : g("hosp") ? NO_RETRO.hosp : undefined });
  // 제4호 교육연구시설 중 합숙소
  if (g("edu_dorm")) {
    if (f.eduDormType === "hapsuk") hits.push({ no: "제4호", text: "교육연구시설 중 합숙소", scope: "해당 시설", noRetro: NO_RETRO.hapsuk });
    else if (f.eduDormType !== "dorm") checks.push({ no: "제4호", text: "교육연구시설 중 합숙소 해당 여부 — 세부 사항에서 '합숙소/기숙사' 선택" });
  }
  // 제5호 노유자 시설
  if (g("noyu")) hits.push({ no: "제5호", text: "노유자 시설", scope: "해당 시설" });
  // 제6호 숙박이 가능한 수련시설
  if (g("training_lodge")) hits.push({ no: "제6호", text: "숙박이 가능한 수련시설", scope: "해당 시설" });
  // 제7호 숙박시설
  if (g("lodging")) hits.push({ no: "제7호", text: "숙박시설", scope: "해당 시설" });
  // 제8호 방송통신시설 중 방송국 및 촬영소
  if (g("bstation")) hits.push({ no: "제8호", text: "방송통신시설 중 방송국", scope: "해당 시설" });
  else if (g("broadcast") && f.studio) hits.push({ no: "제8호", text: "방송통신시설 중 촬영소", scope: "해당 시설" });
  // 제9호 다중이용업소
  if (f.multiUse) hits.push({ no: "제9호", text: "「다중이용업소의 안전관리에 관한 특별법」 제2조제1항제1호에 따른 다중이용업의 영업소", scope: "다중이용업소 영업장" });
  // 제10호 제1호~제9호에 해당하지 않는 것으로서 층수 11층 이상(아파트등 제외)
  if (!hits.length && gf >= 11) {
    if (g("apt")) notes.push("아파트등은 제10호(11층 이상)에서 제외됩니다.");
    else if (g("mixed_res")) checks.push({ no: "제10호", text: `층수 ${gf}층 — 주택 겸용 복합건축물의 아파트등 부분 제외 범위 확인` });
    else hits.push({ no: "제10호", text: `제1호~제9호에 해당하지 않는 것으로서 층수가 11층 이상(지상 ${gf}층)`, scope: "건축물 전체" });
  }
  if (hits.length && hits.some((h) => h.no !== "제9호" && h.no !== "제10호") && gf >= 11 && !g("apt")) {
    notes.push("제1호~제9호에 해당하는 부분 외의 부분이 제10호(11층 이상)에 해당하는지 함께 확인하십시오.");
  }
  if (hits.some((h) => h.noRetro)) notes.push("「소급 없음」 표시 대상은 개정 부칙 적용례에 따라 시행 이후 실내장식물 등을 설치(일부는 교체 포함)하는 경우부터 방염 대상입니다 — 기존 물품은 설치 시점을 확인하십시오.");
  if (mode === "existing") notes.push("방염은 현행 시행령 제30조로 판정했습니다(종전 대상은 2004.5.30. 시행 대통령령 제18404호 부칙 제3조에 따라 2007.5.30.까지 소급 적용).");
  const status = hits.length ? S.YES : checks.length ? S.CHK : S.NO;
  return { status, hits, checks, notes, ref: SAFETY_REFS.flame };
}

/** 소방자동차 전용구역 설치 대상 공동주택 */
export function fireLane(rv, mode) {
  const u = rv.use;
  const input = rv.input;
  const f = input.f || {};
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  const gf = num(input.gf) ?? 0;
  const date = input.date;
  const notes = [];
  const out = (status, reason, extra = {}) => ({ status, reason, notes, ref: SAFETY_REFS.lane, ...extra });

  let cand = null; // 대상 공동주택 해당: true/false/null
  let what = "";
  if (g("apt")) {
    const hh = num(f.households);
    what = `아파트 ${hh === null ? "세대수 미입력" : fmtN(hh) + "세대"}`;
    cand = hh === null ? null : hh >= 100;
    if (cand === false) return out(S.NO, `${what} — 100세대 미만 아파트`);
  } else if (g("dorm")) {
    what = `기숙사 지상 ${gf}층`;
    cand = gf >= 3;
    if (!cand) return out(S.NO, `${what} — 3층 미만 기숙사`);
  } else if (g("edu_dorm")) {
    if (f.eduDormType === "hapsuk") return out(S.NO, "교육연구시설 중 합숙소 — 공동주택(아파트·기숙사)이 아님");
    if (f.eduDormType !== "dorm") return out(S.CHK, "합숙소/기숙사 구분을 선택하십시오(학교 기숙사는 공동주택 기숙사 — 3층 이상이면 대상).");
    notes.push("학교 기숙사는 「건축법 시행령」 별표1 제2호라목 기숙사(공동주택)에 포함됩니다(현행 소방시설법 시행령 별표2 교육연구시설에는 기숙사가 없음).");
    what = `기숙사(학교) 지상 ${gf}층`;
    cand = gf >= 3;
    if (!cand) return out(S.NO, `${what} — 3층 미만 기숙사`);
  } else if (g("mixed_res")) {
    return out(S.CHK, "주택 겸용 복합건축물 — 주택 부분이 「건축법 시행령」 별표1 제2호가목 아파트(100세대 이상)인지 확인하십시오.");
  } else {
    return out(S.NO, "대상 용도 아님 — 100세대 이상 아파트, 3층 이상 기숙사만 해당");
  }
  if (cand === null) return out(S.CHK, `${what} — 세대수를 입력하십시오(100세대 이상 대상).`);

  // 적용 시점: 2018.8.10. 이후 최초 '신청'분
  if (date < LANE_FROM) return out(S.NO, `${what} — ${date.replace(/-/g, ".")}. 허가(신청)분: 2018.8.10. 전 신청이므로 적용 제외(${SAFETY_REFS.laneBuchik})`);
  // 단서: 하나의 대지에 하나의 동 + 정차·주차 금지된 편도 2차선 이상 도로에 직접 접하여 도로에서 직접 소방활동 가능 (2021.5.4. 개정 단서는 기존 공동주택에도 적용)
  if (f.laneException) return out(S.NO, `${what} — 시행령 제7조의12 단서(1개 동 + 편도 2차선 이상 정차·주차금지 도로에 직접 접함)에 해당하여 제외`, { exc: true });
  if (mode === "existing" && date < LANE_ASK_UNTIL) {
    notes.push("부칙은 '신청'일 기준입니다. 건축허가일이 2018.8.10. 직후이면 주택건설사업계획 승인 또는 건축허가 '신청일'이 2018.8.10. 이후인지 확인하십시오.");
    return out(S.CHK, `${what} — 신청일 확인 필요(2018.8.10. 이후 신청분부터 적용)`);
  }
  notes.push("하나의 대지에 하나의 동으로 구성되고 정차·주차가 금지된 편도 2차선 이상 도로에 직접 접하여 도로에서 직접 소방활동이 가능하면 제외(시행령 제7조의12 단서 — 세부 사항에서 체크).");
  return out(S.YES, `${what} — 각 동별 전면 또는 후면에 전용구역 1개소 이상`, { how: SAFETY_REFS.laneHow });
}

/** 세 항목 한꺼번에 */
export function safetyReview(rv, mode, applied) {
  return { grade: fireSafetyGrade(rv, mode, applied), flame: flameRetardant(rv, mode), lane: fireLane(rv, mode) };
}
