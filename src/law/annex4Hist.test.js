// 법제처 시행령 시행일별 연혁본(eflaw) 원문 판별 대조로 고친 연혁 판정(v2.38.0)
import { evaluateAt, STATUS } from "./engine";

const floors = (gf, bf, area, wl = []) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: wl.includes(i) });
  return list;
};
const st = (r, k) => r.byKey[k].status;
const b = (use, o = {}, f = {}) => ({ action: "new", use, area: 6000, gf: 3, bf: 0, floors: floors(3, 0, 2000), f, ...o });

describe("2004.5.30.~2011.7.6. 「판매시설 및 영업시설」 — 영업시설(여객·화물터미널·철도역사·공항·항만)", () => {
  test("스프링클러: 물류터미널(화물터미널) 3층 6,000㎡ → 2004~2014.10.7. 판매시설 기준 적용", () => {
    expect(st(evaluateAt(b("logistics"), "2008-01-01"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b("logistics"), "2012-01-01"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b("transport"), "2012-01-01"), "spk")).toBe(STATUS.REQ);
    // 3층 이하 5,500㎡(6천 미만) → 비대상
    expect(st(evaluateAt(b("logistics", { area: 5500, floors: floors(3, 0, 1833) }), "2012-01-01"), "spk")).not.toBe(STATUS.REQ);
  });
  test("연결살수: 운수시설 1천㎡ 이상 → 2011.7.7. 전에도 대상(영업시설)", () => {
    const t = b("transport", { area: 1200, gf: 1, floors: floors(1, 0, 1200) });
    expect(st(evaluateAt(t, "2009-01-01"), "conspk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(t, "2012-01-01"), "conspk")).toBe(STATUS.REQ);
  });
  test("제연: 지하층 운수시설 1천㎡ → 2011.7.7. 전(영업시설)·후(운수시설) 모두 대상, 2012~2013 「확인 필요」 없음", () => {
    const t = b("transport", { area: 2400, gf: 1, bf: 1, floors: floors(1, 1, 1200) });
    for (const d of ["2009-01-01", "2012-10-01"]) expect(st(evaluateAt(t, d), "smoke")).toBe(STATUS.REQ);
  });
  test("가스누설경보기: 가스시설 있는 운수시설 → 2011.7.7. 전에도 대상", () => {
    expect(st(evaluateAt(b("transport", {}, { gasUse: true }), "2009-01-01"), "gasleak")).toBe(STATUS.REQ);
  });
});

test("제연 의료·노유자 지하층 1천㎡ — 2015.4.7.부터 확정(법제처 2015.4.7. 시행판)", () => {
  const m = b("noyu", { area: 2400, gf: 1, bf: 1, floors: floors(1, 1, 1200) });
  expect(st(evaluateAt(m, "2015-04-06"), "smoke")).not.toBe(STATUS.REQ);
  expect(st(evaluateAt(m, "2015-04-07"), "smoke")).toBe(STATUS.REQ);
});

test("제연 지하층 운수시설 1천㎡ — 2011.7.7. 전후 규칙 전환(영업시설 → 운수시설)이 끊김 없이 이어짐", () => {
  const t = b("transport", { area: 2400, gf: 1, bf: 1, floors: floors(1, 1, 1200) });
  for (const d of ["2011-07-06", "2011-07-07"]) expect(st(evaluateAt(t, d), "smoke")).toBe(STATUS.REQ);
});

test("2022.12.1. 전부개정 항목은 법제처 연혁본 대조로 확정(V) — 숙박시설 자탐·600㎡ 스프링클러·300~600㎡ 간이스프링클러", () => {
  const l = (area) => b("lodging", { area, gf: 2, floors: floors(2, 0, area / 2) });
  expect(st(evaluateAt(l(400), "2022-11-30"), "afd")).not.toBe(STATUS.REQ);
  expect(st(evaluateAt(l(400), "2022-12-01"), "afd")).toBe(STATUS.REQ);
  expect(st(evaluateAt(l(400), "2022-12-01"), "sspk")).toBe(STATUS.REQ);
  expect(st(evaluateAt(l(700), "2022-12-01"), "spk")).toBe(STATUS.REQ);
});

test("스프링클러 6층 이상 — 2018.1.27. 신청분부터 설치(제27810호 부칙 제1조 단서·제2조제1항), 「확인 필요」 없음", () => {
  const o = b("office", { area: 4200, gf: 7, floors: floors(7, 0, 600) });
  expect(st(evaluateAt(o, "2018-01-26"), "spk")).not.toBe(STATUS.REQ);
  expect(st(evaluateAt(o, "2018-01-27"), "spk")).toBe(STATUS.REQ);
});

test("내부 주차장 물분무등 — 2018.1.27.~2022.11.30.은 「200㎡ 이상인 층」 기준이라 합계만으로는 확인 필요", () => {
  const p = b("office", { area: 3000, gf: 3, bf: 2, floors: floors(3, 2, 600) }, { parkingInside: 300, ugParking: 300 });
  expect(st(evaluateAt(p, "2018-01-26"), "water")).toBe(STATUS.REQ);
  const mid = st(evaluateAt(p, "2019-06-01"), "water");
  expect([STATUS.CHK, STATUS.REQ_CHK]).toContain(mid);
  expect(st(evaluateAt(p, "2022-12-01"), "water")).toBe(STATUS.REQ);
  // 합계 200㎡ 미만이면 그대로 비대상
  const s = b("office", { area: 3000, gf: 3, bf: 1, floors: floors(3, 1, 600) }, { parkingInside: 150, ugParking: 150 });
  expect(st(evaluateAt(s, "2019-06-01"), "water")).not.toBe(STATUS.REQ);
});
