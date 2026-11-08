// ============================================================
// 판정 엔진
//  evaluateAt(input, date)  : 특정 기준일의 설치대상 판정
//  review(input, today)     : 당시 기준 + 현행 비교 + 부칙 소급 + 강화기준 + 증축·용도변경
// ============================================================
import { CRITERIA } from "./criteria";
import { FACILITIES, getFacility, stdLabel, EXEMPTION_HINTS } from "./facilities";
import { D, getLawSystem, SOURCES } from "./sources";
import { getUse } from "./uses";
import { derive, consistencyIssues, num } from "./logic";
import { RETRO_RULES, strengthenedFacs, STRENGTHENED, housingFacilityNote, extensionRule } from "./retro";

export const STATUS = {
  REQ: "설치",
  REQ_CHK: "설치(연혁 확인)",
  CHK: "확인 필요",
  NONE: "해당없음",
};
const RANK = { [STATUS.REQ]: 3, [STATUS.REQ_CHK]: 2, [STATUS.CHK]: 1, [STATUS.NONE]: 0 };

/** 기준일에 규칙이 효력이 있는지: 'yes' | 'maybe' | 'no' */
export function effectAt(c, d) {
  let a = "yes";
  if (c.from) a = d >= c.from ? "yes" : "no";
  else if (c.fromU) a = d >= c.fromU[1] ? "yes" : d >= c.fromU[0] ? "maybe" : "no";
  let b = "yes";
  if (c.to) b = d < c.to ? "yes" : "no";
  else if (c.toU) b = d < c.toU[0] ? "yes" : d < c.toU[1] ? "maybe" : "no";
  if (a === "no" || b === "no") return "no";
  if (a === "maybe" || b === "maybe") return "maybe";
  return "yes";
}

export function tableRef(date) {
  if (date >= D.C) return "소방시설법 시행령 별표4";
  if (date >= D.B12) return "구 화재예방소방시설법 시행령 별표5(당시 별표 번호 연혁본 확인)";
  if (date >= D.A) return "구 소방시설설치유지법 시행령 별표4";
  if (date >= D.P92) return "구 소방법 시행령 별표(소방특별조사 운영매뉴얼 연도별 적용기준)";
  return "구 소방법 시행령 별표(1992.7.28. 이전 — 미수록)";
}

function refText(fac, crit, date) {
  if (date >= D.C) return `${tableRef(date)} ${fac.cur}${crit.cur ? " " + crit.cur : ""}`;
  return `${tableRef(date)} — ${fac.name} 적용기준`;
}

const toDep = (st) => (st === STATUS.REQ ? true : st === STATUS.NONE ? false : null);

/**
 * @param input 사용자 입력
 * @param date  'YYYY-MM-DD'
 * @param overrides 관리자 검증 오버라이드 { [critId]: { cert, disabled, note } }
 */
export function evaluateAt(input, date, overrides = {}) {
  const u = getUse(input.use);
  if (!u) return null;
  const x = derive(input, u);
  const f = input.f || {};
  const unsupported = date < D.P92;
  const evalDate = unsupported ? D.P92 : date;
  // 특정소방대상물 해당 여부(별표2) 선행 판정
  //  - 단독주택: 해당 없음(주택용소방시설만)
  //  - 연립·다세대: 2024.12.1. 신청분부터 별표2 공동주택 편입(대통령령 제33004호 부칙). 2004.5.30.~2024.11.30.은
  //    공동주택 = 아파트등·기숙사뿐 → 별표4 미적용. 내부 차고·주차장(물분무등)만 별도 검토(연혁 확인)
  //  - 1992.7.28.~2004.5.29.(소방법) 연립·다세대: 당시 소방대상물 분류 확인 필요 → 결과 전체 하향
  const isRowMulti = u.g.includes("row") || u.g.includes("multi");
  const rowPre = isRowMulti && date < D.C24;
  const rowGap = isRowMulti && date >= D.A && date < D.C24;
  const rowOld = isRowMulti && date < D.A;
  const nonSpecific = u.g.includes("house") || rowGap;
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  const ctx = { u, x, f, g, d: evalDate, dep: {} };

  const byFac = {};
  for (const fac of FACILITIES) byFac[fac.key] = { fac, status: STATUS.NONE, hits: [], checks: [], maybes: [] };

  const run = (crit) => {
    const parkingOnly = rowGap && crit.fac === "water" && (crit.id === "wat-inpark" || crit.id === "wat-mech");
    if (nonSpecific && !parkingOnly) return;
    const ov = overrides[crit.id] || {};
    if (ov.disabled) return;
    const eff = effectAt(crit, evalDate);
    if (eff === "no") return;
    const fac = getFacility(crit.fac);
    let r;
    try {
      r = crit.when(ctx);
    } catch (e) {
      r = null;
    }
    if (r === false || r === undefined) return;
    const cert = ov.cert || crit.cert;
    const item = {
      id: crit.id,
      text: crit.text,
      scope: crit.scope,
      basis: safe(() => crit.basis(ctx)),
      ref: refText(fac, crit, date),
      cert,
      effect: eff,
      src: crit.src,
      note: ov.note || "",
    };
    const bucket = byFac[crit.fac];
    if (r === true) {
      // 미검증(U)·시점추정(I) 규칙, 효력시점 불명확 구간, 미수록 기간, 특정소방대상물 해당 여부 불명확 → '설치(연혁 확인)'
      const downgrade = eff === "maybe" || cert === "U" || cert === "I" || unsupported || rowOld || parkingOnly;
      if (downgrade) bucket.maybes.push(item);
      else bucket.hits.push(item);
    } else {
      bucket.checks.push(item);
    }
  };

  const primary = CRITERIA.filter((c) => !c.dependsOn);
  const dependent = CRITERIA.filter((c) => c.dependsOn);
  primary.forEach(run);
  for (const k of Object.keys(byFac)) byFac[k].status = statusOf(byFac[k]);
  ctx.dep.afd = toDep(byFac.afd.status);
  dependent.forEach(run);
  for (const k of Object.keys(byFac)) byFac[k].status = statusOf(byFac[k]);

  const rows = FACILITIES.map((fac) => {
    const b = byFac[fac.key];
    const ex = EXEMPTION_HINTS[fac.key];
    const exHint =
      fac.key === "report" && b.status !== STATUS.NONE && f.staffed24 && date >= D.U14b
        ? "방재실 등 화재 수신기 설치 장소에 24시간 화재 감시 인원 상시 근무 → 자동화재속보설비를 설치하지 않을 수 있음(별표4 제2호사목 단서; 2014.10.8. 단서 신설 — 당시는 일부 대상만)"
        : ex && b.status !== STATUS.NONE && ex.by.some((k) => byFac[k] && byFac[k].status === STATUS.REQ)
        ? ex.text
        : "";
    return { ...b, std: stdLabel(fac, date), exHint };
  });

  return {
    date,
    system: getLawSystem(date),
    unsupported,
    rowPre,
    rowGap,
    rowOld,
    nonSpecific,
    table: tableRef(date),
    rows,
    byKey: Object.fromEntries(rows.map((r) => [r.fac.key, r])),
    x,
    u,
  };
}

function statusOf(b) {
  if (b.hits.length) return STATUS.REQ;
  if (b.maybes.length) return STATUS.REQ_CHK;
  if (b.checks.length) return STATUS.CHK;
  return STATUS.NONE;
}
function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return "";
  }
}

/** 용도별로 추가 확인할 입력 체크리스트 */
function inputChecklist(u, input, x) {
  const f = input.f || {};
  const out = [];
  const g = (...k) => k.some((kk) => u.g.includes(kk));
  if (!x.floorsComplete) out.push("층별 바닥면적이 비어 있어 '층' 단위 기준(지하·무창·4층 이상 600㎡/1천㎡, 지하층 합계 등)이 [확인 필요]로 표시될 수 있습니다.");
  if (x.useAreaAssumed && !g("apt", "house")) out.push("해당 용도 바닥면적 합계 미입력 → 연면적을 해당 용도 면적으로 간주했습니다(복합 용도이면 입력 필요).");
  if (x.occ === null && g("culture", "religion", "sports", "training_lodge", "lodging"))
    out.push("수용인원(시행령 별표7: 의자·침대 수 기준) 미입력 — 수용인원 기준(100명 등)이 판정되지 않습니다.");
  else if (x.occEstimated && g("retail", "transport", "logistics", "station", "ugmall"))
    out.push("수용인원 미입력 → 시행령 별표7 제2호 기준 상한(해당 용도 바닥면적 ÷ 3㎡, 교육연구시설 ÷ 1.9㎡)으로 판정했습니다. 복도·계단·화장실을 빼야 하므로 경계값 부근이면 실제 수용인원을 입력하십시오.");
  if (!x.floorsComplete)
    out.push("미입력 층의 바닥면적은 '연면적 − 입력된 층 면적 합'을 상한으로 보고 판정합니다(연면적에는 지하층 포함, 건축법 시행령 제119조제1항제4호).");
  if (g("factory", "warehouse") && num(f.combustibleTimes) === null) out.push("특수가연물 저장·취급량(지정수량 배수) 미입력 → 관련 기준(500·750·1,000배)은 [확인 필요]. 취급하지 않으면 0을 입력하십시오.");
  if (g("warehouse") && num(f.rackArea) === null) out.push("랙식 창고 바닥면적 미입력 → 스프링클러 랙식 기준은 [확인 필요]. 랙식 창고가 아니면 0을 입력하십시오.");
  if (g("gas") && num(f.gasTankTon) === null) out.push("가스시설 지상 노출 탱크 저장용량 미입력 → 상수도소화용수·연결살수 기준은 [확인 필요].");
  if (g("culture", "religion", "sports") && !g("zoo") && num(f.stageArea) === null) out.push("무대부 바닥면적 미입력 → 스프링클러·제연설비 무대부 기준은 [확인 필요]. 무대부가 없으면 0을 입력하십시오.");
  if (g("factory", "warehouse") && !f.nonFireproof) out.push("지붕·외벽 불연재료/내화구조 여부 확인(아니면 '불연·내화 아님' 체크).");
  if (g("tunnel") && f.tunnelLen == null) out.push("터널 길이 미입력.");
  if (!f.parkingInside && !f.ugParking && !g("tunnel", "ugduct")) out.push("건축물 내부 차고·주차장 면적(물분무등 200㎡)·지하 주차장 면적(2026.3.1. 기준) 해당 여부 확인.");
  if (!f.elecRoom) out.push("전기실·발전실·변전실·통신기기실·전산실 바닥면적(물분무등 300㎡) 확인.");
  if (!f.specialStairs) out.push("특별피난계단·비상용승강기 승강장 설치 여부(제연설비) 확인.");
  return out;
}

/**
 * 종합 검토
 * input.action: 'new' | 'extension' | 'usechange'
 * input.date: 최초(또는 당해) 건축허가등 신청일, input.date2: 증축·용도변경 신청일
 */
export function review(input, today, overrides = {}) {
  const u = getUse(input.use);
  if (!u || !input.date) return null;
  const x = derive(input, u);
  const issues = consistencyIssues(input, x);
  const ext = input.action !== "new" && input.date2 ? extensionRule(input) : null;

  // 적용 기준일 및 부분별 판정 입력 결정
  //  - 증축(구획 예외): 기존 부분 = 증축 전 규모 × 최초 신청일 기준 / 증축 부분 = 증축 후 전체 규모 × 증축 신청일 기준
  //  - 용도변경(제15조②): 기존 부분 = 변경 전 용도 × 최초 신청일 기준 / 변경 부분 = 변경 후 용도·변경 면적 × 변경 신청일 기준
  //  - 용도변경 예외(제15조② 단서): 전체 = 변경 전 용도에 적용되던 기준
  let primaryDate = input.date;
  let primaryInput = input;
  let primaryLabel = "";
  let secondary = null; // {label, date}
  let secondInput = input;
  const prevUse = input.prevUse ? getUse(input.prevUse) : null;
  const changeArea = num(input.changeArea);
  if (ext) {
    if (input.action === "extension") {
      if (ext.wholeDate) primaryDate = ext.wholeDate;
      else if (ext.partDates) {
        primaryDate = ext.partDates.existing;
        primaryLabel = "기존 부분(증축 전 규모)";
        primaryInput = beforeExtension(input);
        if (!primaryInput) issues.push("증축 전 연면적·층수를 입력하지 않아 기존 부분도 증축 후 규모로 판정했습니다(과다 판정 가능) — 「증축 전 규모」를 입력하십시오.");
        primaryInput = primaryInput || input;
        secondary = { label: "증축 부분(증축 후 전체 규모로 판단)", date: ext.partDates.added };
      }
    } else if (input.action === "usechange") {
      if (!prevUse) issues.push("변경 전 용도를 선택하지 않아 기존 부분도 변경 후 용도로 판정했습니다 — 「변경 전 용도」를 선택하십시오.");
      if (ext.wholeDate) {
        primaryDate = ext.wholeDate;
        primaryLabel = prevUse ? `전체(변경 전 용도 ${prevUse.name} 기준)` : "";
        if (prevUse) primaryInput = { ...input, use: prevUse.id, useArea: "" };
      } else if (ext.partDates) {
        primaryDate = ext.partDates.existing;
        if (prevUse) {
          const area = num(input.area);
          primaryLabel = `기존 부분(변경 전 용도: ${prevUse.name})`;
          primaryInput = { ...input, use: prevUse.id, useArea: area !== null && changeArea !== null ? Math.max(0, area - changeArea) : "" };
        }
        secondary = { label: `용도변경 부분(${u.name}${changeArea !== null ? `, ${changeArea.toLocaleString("ko-KR")}㎡` : ""})`, date: ext.partDates.added };
        secondInput = changeArea !== null ? { ...input, useArea: changeArea } : input;
        if (changeArea === null) issues.push("용도변경 부분 면적을 입력하지 않아 '해당 용도 바닥면적 합계' 입력값(없으면 연면적)으로 판정했습니다.");
      }
    }
  }
  const hist = evaluateAt(primaryInput, primaryDate, overrides);
  const second = secondary ? evaluateAt(secondInput, secondary.date, overrides) : null;
  const curr = evaluateAt(input, today, overrides);

  // 부칙 소급(의무) — 각 부칙의 '시행 당시 건축 완료(설치)된' 대상물: 사용승인일(설치완료일)로 판정
  const completed = input.completed || "";
  const retro = RETRO_RULES.filter((r) => r.applies(u, input) && input.date < r.before && (!completed || completed < r.before)).map((r) => {
    // 부칙은 '개정규정에 따라' 설치하도록 하므로, 부칙 시행일 기준 판정으로 실제 설치할 시설을 정함(예: 600㎡ 이상 SPK / 미만 간이SPK)
    const at = evaluateAt(input, r.before, overrides);
    return {
      ...r,
      needsCompletion: !completed,
      facNames: r.facs.map((k) => getFacility(k).name),
      expired: today > r.deadline,
      histStatus: r.facs.map((k) => ({ k, name: getFacility(k).name, st: hist.byKey[k].status })),
      atStatus: r.facs.map((k) => ({ k, name: getFacility(k).name, st: at.byKey[k].status, row: at.byKey[k] })),
    };
  });
  const retroExcluded = completed
    ? RETRO_RULES.filter((r) => r.applies(u, input) && input.date < r.before && completed >= r.before).map((r) => r.title)
    : [];
  const retroFacSet = new Set(retro.flatMap((r) => r.facs));

  // 현행 비교 + 법 제13조 강화기준
  const sFacs = strengthenedFacs(u);
  const compare = FACILITIES.map((fac) => {
    const h = hist.byKey[fac.key].status;
    const c = curr.byKey[fac.key].status;
    let kind = "same";
    // 어느 한쪽이라도 '확인 필요'(정보 부족)이면 강화·완화를 확정하지 않음
    if (h === STATUS.CHK || c === STATUS.CHK) kind = h === c ? "same" : "unknown";
    else if (RANK[c] >= 2 && RANK[h] < 2) kind = "added";
    else if (RANK[h] >= 2 && RANK[c] < 2) kind = "removed";
    let retroKind = "";
    if (kind === "added") {
      if (retroFacSet.has(fac.key)) retroKind = "부칙 소급(의무)";
      else if (sFacs.has(fac.key)) retroKind = "강화기준 적용 가능(재량, 법 제13조①단서)";
      else retroKind = "소급 없음(종전 기준 유지, 법 제13조①본문)";
    }
    return { fac, h, c, kind, retroKind };
  });

  return {
    input,
    use: u,
    today,
    issues,
    ext,
    primaryDate,
    primaryLabel,
    secondary,
    retroExcluded,
    hist,
    second,
    curr,
    retro,
    housing: housingFacilityNote(u, input.date),
    compare,
    strengthenedBasis: STRENGTHENED.basis,
    checklist: inputChecklist(u, input, x),
    sources: SOURCES,
  };
}

/** 증축 전 규모 입력 → 기존 부분 판정용 입력 (층별 면적은 미상으로 두고 연면적 상한으로 판정) */
function beforeExtension(input) {
  const area = num(input.prevArea);
  const gf = num(input.prevGf);
  if (area === null || gf === null) return null;
  const bf = num(input.prevBf) ?? 0;
  const floors = [];
  for (let i = bf; i >= 1; i--) floors.push({ level: -i, area: "", windowless: false });
  for (let i = 1; i <= gf; i++) floors.push({ level: i, area: "", windowless: false });
  return { ...input, area, gf, bf, useArea: "", floors };
}

/** 검토표 CSV (엑셀 호환 BOM) */
export function toCSV(rv) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["구분", "소방시설", `당시(${rv.primaryDate})`, "판정 근거(기준값/대상 수치)", "법령 근거", `현행(${rv.today})`, "현행 대비", "화재안전기준", "비고"];
  const lines = [head.map(esc).join(",")];
  for (const row of rv.hist.rows) {
    const cmp = rv.compare.find((c) => c.fac.key === row.fac.key);
    const items = [...row.hits, ...row.maybes, ...row.checks];
    const basis = items.map((i) => `${i.text} / ${i.basis}`).join(" | ");
    const refs = [...new Set(items.map((i) => i.ref))].join(" | ");
    lines.push(
      [row.fac.cat, row.fac.name, row.status, basis, refs, cmp.c, cmp.retroKind || (cmp.kind === "removed" ? "현행 미대상" : cmp.kind === "unknown" ? "비교 판정 불가(확인 필요)" : ""), row.std, row.exHint]
        .map(esc)
        .join(",")
    );
  }
  return "﻿" + lines.join("\r\n");
}
