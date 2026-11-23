// ============================================================
// 설치 목록 구성 공통 로직 — 결과 화면(Report.js)과 미니게임(stagesAdapter.js)이 함께 사용
//  · 별표5 대체(면제) 후보 산정 · 기본 선택 대체 · 기본값 설치 목록(부칙 소급 의무 반영, 강화기준 미반영)
// ============================================================
import { SUBSTITUTIONS, getFacility } from "./facilities";
import { STATUS } from "./engine";

export const isReq = (s) => s === STATUS.REQ || s === STATUS.REQ_CHK;
export const PARKING_WATER = ["wat-parkbldg", "wat-inpark", "wat-mech"];
// 실무상 거의 항상 적용하는 대체 — 기본 선택
export const SUB_DEFAULT_ON = new Set(["s4", "s5", "s8", "s8b", "s19", "s21"]);
/** 기본 선택 여부 — 대체 설비가 물분무등뿐인 제4·19·21호(물분무·미분무만 인정, 포·가스계 제외)는 기본 해제 */
export const subDefaultOn = (s) => SUB_DEFAULT_ON.has(s.id) && !s.weakOnly;

/** 대체 후보: 대상 시설이 설치 대상이고, 대체 시설이 설치 대상(또는 무관)인 경우 */
export function substitutionsFor(rows, u) {
  const by = Object.fromEntries(rows.map((r) => [r.fac.key, r]));
  const out = [];
  for (const s of SUBSTITUTIONS) {
    const t = by[s.target];
    if (!t || !isReq(t.status)) continue;
    if (s.heritageOnly && !u.g.includes("heritage")) continue;
    if (s.parkingOnly) {
      // 제5호: 차고·주차장에 스프링클러설비를 설치한 경우만 — 스프링클러설비가 설치 대상(확정)일 때만 후보
      if (!by.spk || by.spk.status !== STATUS.REQ) continue;
      const ids = [...t.hits, ...t.maybes].map((i) => i.id);
      const park = ids.filter((id) => PARKING_WATER.includes(id));
      if (!park.length) continue;
      const partial = ids.some((id) => !PARKING_WATER.includes(id));
      out.push({ ...s, partial, viaKeys: ["spk"] });
      continue;
    }
    if (s.any) continue; // 설비 외 조건(공공소화전·지락차단장치 등) — 관리자 상세에서만 안내
    const via = s.by.filter((k) => by[k] && by[k].status === STATUS.REQ);
    if (!via.length) continue;
    const weakOnly = !via.some((k) => !(s.weak || []).includes(k)); // 물분무등뿐 — 물분무·미분무소화설비일 때만 대체
    out.push({ ...s, viaKeys: via, weakOnly, replaceWith: via.map((k) => getFacility(k).name).join(" / ") });
  }
  return out;
}

/**
 * 선택한 대체를 실제 설치 목록에 맞춰 확정 — 대체 설비가 실제로 설치되는 경우에만 면제
 *  · 대체 설비(via)가 설치 목록(items: key → 항목)에 있어야 하고, 그 설비가 다른 대체로 빠지지 않아야 함
 *    예) 물분무등 ← 스프링클러 를 고르면, 자탐 ← 물분무등 은 스프링클러로도 대체되지 않는 한 적용 불가
 *  · 서로 대체(자탐 ← 화재알림, 화재알림 ← 자탐)는 먼저 고른 것만 적용
 *  → { applied: [sub(viaKeys = 실제 설치되는 대체 설비만)], blocked: Map(id → 사유) }
 */
export function resolveSubs(subs, isOn, items) {
  const applied = [];
  const blocked = new Map();
  const gone = () => new Set(applied.filter((a) => !a.partial).map((a) => a.target));
  const liveVia = (s, removed) => (s.viaKeys || []).filter((k) => items.has(k) && !removed.has(k));
  for (const s of subs) {
    if (!isOn(s) || !items.has(s.target) || items.get(s.target).kind !== "base") continue;
    const removed = gone();
    const via = liveVia(s, removed);
    if (!via.length) {
      blocked.set(s.id, `${(s.viaKeys || []).map((k) => getFacility(k).name).join(" / ")}이(가) 다른 대체로 설치되지 않아 적용할 수 없음`);
      continue;
    }
    // 이 대체로 대상 시설이 빠지면, 이미 적용한 대체 중 그 시설에만 기대던 것이 깨지는지 확인
    if (!s.partial) {
      const after = new Set([...removed, s.target]);
      const breaks = applied.filter((a) => !liveVia(a, after).length);
      if (breaks.length) {
        blocked.set(s.id, `${getFacility(s.target).name}이(가) ${breaks.map((a) => getFacility(a.target).name).join(" / ")}의 대체 설비로 쓰이고 있어 함께 적용할 수 없음`);
        continue;
      }
    }
    applied.push({ ...s, viaKeys: via, replaceWith: via.map((k) => getFacility(k).name).join(" / ") });
  }
  // 나중에 빠진 설비 때문에 앞의 대체가 의지하는 설비가 줄었으면 viaKeys를 다시 좁힘
  const removed = gone();
  return { applied: applied.map((a) => ({ ...a, viaKeys: liveVia(a, a.partial ? removed : new Set([...removed].filter((k) => k !== a.target))) })), blocked };
}

/**
 * 결과 화면 기본값(부칙 소급 의무 전부 반영 · 강화기준 미반영 · 기본 대체 적용)과 같은 설치 목록
 *  → { list, applied: Map(key→true|null), installed: Map(key→true|null), buildKeys: [착공 산정용 key], chkKeys }
 */
export function defaultInstalled(rv, existing) {
  const m = new Map();
  for (const r of rv.hist.rows) if (isReq(r.status)) m.set(r.fac.key, { key: r.fac.key, name: r.fac.name, kind: "base", check: r.status === STATUS.REQ_CHK });
  if (existing) {
    for (const rr of rv.retro) {
      for (const a of rr.atStatus) {
        if (!isReq(a.st) || m.has(a.k)) continue;
        const fac = getFacility(a.k);
        m.set(a.k, { key: a.k, name: fac.name, kind: "retro", retro: rr.title, check: a.st === STATUS.REQ_CHK });
      }
    }
  }
  const { applied: subs } = resolveSubs(substitutionsFor(rv.hist.rows, rv.use), subDefaultOn, m);
  for (const s of subs) m.set(s.target, { ...m.get(s.target), sub: s });
  const list = [...m.values()];
  const applied = new Map(list.filter((i) => i.kind !== "base").map((i) => [i.key, i.check ? null : true]));
  const installed = new Map();
  for (const i of list) {
    if (!i.sub || i.sub.partial) installed.set(i.key, i.check ? null : true);
    if (i.sub) for (const k of i.sub.viaKeys || []) if (!installed.has(k) || installed.get(k) !== true) installed.set(k, true);
  }
  const buildKeys = list.filter((i) => !i.sub || i.sub.partial).map((i) => i.key);
  for (const i of list) if (i.sub) buildKeys.push(...(i.sub.viaKeys || []));
  return { list, applied, installed, buildKeys: [...new Set(buildKeys)], chkKeys: list.filter((i) => i.check).map((i) => i.key) };
}

/**
 * 자체점검(종합점검 대상 판단)용 '설치된 법정 설비' — 결과 화면 설치 목록에서
 *  · 대체된 설비는 빼고 대체 설비(viaKeys)를 넣음(주차장만 대체면 둘 다)
 *  · 자진 설치 설비(kind "vol")는 넣지 않음 — 법정 설치 의무가 없어 종합점검 대상 판단에서 제외
 * → Map(key → true | null(연혁 확인))
 */
export function inspInstalled(list) {
  const installed = new Map();
  for (const i of list) {
    if (i.kind === "vol") continue;
    if (!i.sub || i.sub.partial) installed.set(i.key, i.check ? null : true);
    if (i.sub) for (const k of i.sub.viaKeys || []) if (!installed.has(k) || installed.get(k) !== true) installed.set(k, true);
  }
  return installed;
}
