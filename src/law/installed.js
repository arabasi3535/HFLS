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

/** 대체 후보: 대상 시설이 설치 대상이고, 대체 시설이 설치 대상(또는 무관)인 경우 */
export function substitutionsFor(rows, u) {
  const by = Object.fromEntries(rows.map((r) => [r.fac.key, r]));
  const out = [];
  for (const s of SUBSTITUTIONS) {
    const t = by[s.target];
    if (!t || !isReq(t.status)) continue;
    if (s.heritageOnly && !u.g.includes("heritage")) continue;
    if (s.parkingOnly) {
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
    out.push({ ...s, viaKeys: via, replaceWith: via.map((k) => getFacility(k).name).join(" / ") });
  }
  return out;
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
  for (const s of substitutionsFor(rv.hist.rows, rv.use)) if (SUB_DEFAULT_ON.has(s.id) && m.has(s.target) && m.get(s.target).kind === "base") m.set(s.target, { ...m.get(s.target), sub: s });
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
