// ============================================================
// 보조 계산기 — 무창층 판정 · 수용인원 산정 (순수 계산 함수, 테스트 대상)
// ============================================================

const n = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};
const r2 = (x) => Math.round(x * 100) / 100;

/** 무창층 개구부 인정 최소 치수(m) — 지름 50cm 원이 내접하려면 가로·세로 모두 0.5m 이상 */
export const MIN_SIDE = 0.5;

/**
 * 개구부 한 줄 계산
 *  row: { w, h, cnt, excluded }  (m, m, 개)
 *  → { area, counted, reason }
 */
export function openingRow(row) {
  const w = n(row.w);
  const h = n(row.h);
  const cnt = n(row.cnt) ?? (w !== null && h !== null ? 1 : null);
  if (w === null || h === null || cnt === null) return { area: 0, counted: false, reason: "미입력", empty: w === null && h === null };
  const area = r2(w * h * cnt);
  if (row.excluded) return { area, counted: false, reason: "요건 미충족(직접 제외)" };
  if (w < MIN_SIDE || h < MIN_SIDE) return { area, counted: false, reason: "지름 50cm 원 내접 불가(가로·세로 0.5m 미만)" };
  return { area, counted: true, reason: "" };
}

/**
 * 층별 무창층 판정 (소방시설법 시행령 제2조제1호)
 *  floor: { level, area, doors: [row], windows: [row] }  — 문은 1층만 입력
 *  무창층 = 요건을 갖춘 개구부 면적 합계 ≤ 바닥면적 × 1/30
 */
export function windowlessFloor(floor) {
  const area = n(floor.area);
  const doors = (floor.level === 1 ? floor.doors || [] : []).map((r) => ({ ...r, ...openingRow(r) }));
  const windows = (floor.windows || []).map((r) => ({ ...r, ...openingRow(r) }));
  const sum = r2([...doors, ...windows].filter((r) => r.counted).reduce((s, r) => s + r.area, 0));
  if (area === null || area <= 0) return { area, doors, windows, sum, limit: null, ratio: null, status: "입력 필요" };
  const limit = area / 30;
  const windowless = sum <= limit + 1e-9;
  return {
    area,
    doors,
    windows,
    sum,
    limit: r2(limit),
    ratio: sum / area,
    status: windowless ? "무창층" : "유창층",
    need: windowless ? r2(Math.max(0, limit - sum)) : 0, // 유창층이 되려면 이 값을 '초과'하는 개구부가 더 필요
  };
}

// ============================================================
// 수용인원 산정 — 소방시설법 시행령 제17조, [별표7]
// ============================================================
export const OCC_TYPES = [
  { id: "bed", no: "제1호가목", label: "숙박시설 — 침대가 있는 숙박시설", ex: "호텔·모텔 등 침대 객실" },
  { id: "nobed", no: "제1호나목", label: "숙박시설 — 침대가 없는 숙박시설", ex: "온돌 객실 등", div: 3 },
  { id: "class", no: "제2호가목", label: "강의실·교무실·상담실·실습실·휴게실 용도", ex: "학원·학교 강의실 등", div: 1.9 },
  { id: "hall", no: "제2호나목", label: "강당, 문화 및 집회시설, 운동시설, 종교시설", ex: "공연장·체육관·예배당 등", div: 4.6 },
  { id: "etc", no: "제2호다목", label: "그 밖의 특정소방대상물", ex: "근린생활·판매·업무시설 등", div: 3 },
];

/**
 * 수용인원 산정
 *  i: { type, area, excl, staff, beds1, beds2, seatArea, fixedSeats, benchWidth }
 *  비고1: 복도(준불연재료 이상으로 바닥에서 천장까지 벽으로 구획한 것)·계단·화장실 바닥면적 제외
 *  비고2: 계산 결과 소수점 이하 반올림
 */
export function occupancy(i) {
  const t = OCC_TYPES.find((x) => x.id === i.type);
  if (!t) return { ok: false, msg: "산정 구분을 선택하십시오." };
  const area = n(i.area) ?? 0;
  const excl = n(i.excl) ?? 0;
  const staff = n(i.staff) ?? 0;
  const steps = [];
  if (excl > area) return { ok: false, msg: "제외 면적이 총 바닥면적보다 큽니다." };

  if (t.id === "bed") {
    const b1 = n(i.beds1) ?? 0;
    const b2 = n(i.beds2) ?? 0;
    const raw = staff + b1 + b2 * 2;
    steps.push(`종사자 ${staff}명 + 1인용 침대 ${b1}개 + 2인용 침대 ${b2}개 × 2 = ${r2(raw)}`);
    return { ok: true, t, raw, result: Math.round(raw), steps };
  }
  const net = area - excl;
  if (t.id === "nobed") {
    const raw = staff + net / 3;
    steps.push(`산정 바닥면적 = ${area} − ${excl} = ${r2(net)}㎡`);
    steps.push(`종사자 ${staff}명 + ${r2(net)}㎡ ÷ 3㎡ = ${r2(raw)}`);
    return { ok: true, t, raw, net, result: Math.round(raw), steps };
  }
  if (t.id === "hall") {
    const seatArea = n(i.seatArea) ?? 0;
    const fixed = n(i.fixedSeats) ?? 0;
    const bench = n(i.benchWidth) ?? 0;
    if (seatArea > net) return { ok: false, msg: "관람석(의자 설치) 부분 면적이 산정 바닥면적보다 큽니다." };
    const floorPart = (net - seatArea) / 4.6;
    const benchPart = bench / 0.45;
    const raw = floorPart + fixed + benchPart;
    steps.push(`산정 바닥면적 = ${area} − ${excl}${seatArea ? ` − 관람석 ${seatArea}` : ""} = ${r2(net - seatArea)}㎡`);
    steps.push(`${r2(net - seatArea)}㎡ ÷ 4.6㎡ = ${r2(floorPart)}`);
    if (fixed) steps.push(`고정식 의자 ${fixed}석`);
    if (bench) steps.push(`긴 의자 정면너비 ${bench}m ÷ 0.45m = ${r2(benchPart)}`);
    if (fixed || bench) steps.push(`합계 = ${r2(raw)}`);
    return { ok: true, t, raw, net, result: Math.round(raw), steps };
  }
  const raw = net / t.div;
  steps.push(`산정 바닥면적 = ${area} − ${excl} = ${r2(net)}㎡`);
  steps.push(`${r2(net)}㎡ ÷ ${t.div}㎡ = ${r2(raw)}`);
  return { ok: true, t, raw, net, result: Math.round(raw), steps };
}
