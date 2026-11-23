// 시행령 별표4 제외조항 보완(v2.36.1) — 법제처 원문 판별 확인 시점으로 시기별 판정
import { evaluateAt, STATUS } from "./engine";

const floors = (gf, bf, area) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: false });
  return list;
};
const st = (r, k) => r.byKey[k].status;
const bld = (use, f = {}, o = {}) => ({ action: "new", use, area: 4000, gf: 2, bf: 0, floors: floors(2, 0, 2000), f, ...o });

test("옥내소화전 — 원격 조정 무인변전소는 2011.7.7.부터 제외", () => {
  const b = bld("office", { unmannedSub: true });
  expect(st(evaluateAt(b, "2011-07-06"), "hydrant")).toBe(STATUS.REQ);
  expect(st(evaluateAt(b, "2011-07-07"), "hydrant")).toBe(STATUS.NONE);
  expect(st(evaluateAt(bld("office"), "2026-11-17"), "hydrant")).toBe(STATUS.REQ);
});

describe("스프링클러 — 문화집회·종교·운동시설(수용인원 100명 이상)", () => {
  const big = (use, f) => bld(use, f, { occ: 300 });
  test("종교: 사찰·제실·사당은 2014.10.7.까지, 주요구조부 목조는 2014.10.8.부터 제외", () => {
    expect(st(evaluateAt(big("religion", { temple: true }), "2010-01-01"), "spk")).toBe(STATUS.NONE);
    expect(st(evaluateAt(big("religion", { temple: true }), "2015-01-01"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("religion", { woodStructure: true }), "2014-10-07"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("religion", { woodStructure: true }), "2014-10-08"), "spk")).toBe(STATUS.NONE);
  });
  test("운동: 물놀이형 2011.7.7.~, 바닥 불연재료·관람석 없음 2022.12.1.~ 제외", () => {
    expect(st(evaluateAt(big("sports", { waterPlay: true }), "2011-07-06"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("sports", { waterPlay: true }), "2011-07-07"), "spk")).toBe(STATUS.NONE);
    expect(st(evaluateAt(big("sports", { noSeatNonComb: true }), "2022-11-30"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("sports", { noSeatNonComb: true }), "2022-12-01"), "spk")).toBe(STATUS.NONE);
  });
});

describe("스프링클러 층수 기준 예외", () => {
  const tall = (use, f) => bld(use, f, { area: 3000, gf: 6, floors: floors(6, 0, 500) });
  test("스프링클러 없는 기존 건축물 용도변경: 2018.10.8.(소방청 지침)부터 6층 기준 제외", () => {
    expect(st(evaluateAt(tall("office", { useChangeNoSpk: true }), "2018-10-07"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(tall("office", { useChangeNoSpk: true }), "2018-10-08"), "spk")).toBe(STATUS.NONE);
    expect(st(evaluateAt(tall("office", { useChangeNoSpk: true }), "2020-09-15"), "spk")).toBe(STATUS.NONE);
  });
  test("아파트 리모델링(연면적·층높이 불변): 6층·11층 기준 제외", () => {
    expect(st(evaluateAt(tall("apt", { aptRemodel: true }), "2026-11-17"), "spk")).toBe(STATUS.NONE);
    expect(st(evaluateAt(tall("apt"), "2026-11-17"), "spk")).toBe(STATUS.REQ);
  });
});

test("출입국 보호시설 임차건물 — 스프링클러 대신 간이스프링클러(2008.8.16.~)", () => {
  const r = evaluateAt(bld("correction", { immigLeased: true }), "2026-11-17");
  expect([st(r, "spk"), st(r, "sspk")]).toEqual([STATUS.NONE, STATUS.REQ]);
  const r2 = evaluateAt(bld("correction"), "2026-11-17");
  expect([st(r2, "spk"), st(r2, "sspk")]).toEqual([STATUS.REQ, STATUS.NONE]);
});

test("물분무등 — 전기저장시설 중 UPS 시설은 2024.12.31.부터 제외", () => {
  const b = bld("ess", { ups: true, elecRoom: 400 });
  expect(st(evaluateAt(b, "2024-12-30"), "water")).toBe(STATUS.REQ);
  expect(st(evaluateAt(b, "2024-12-31"), "water")).toBe(STATUS.NONE);
});

test("자동화재탐지설비 — 동·식물 관련 시설 기둥·지붕만 개방 부분은 2012.2.5.부터 연면적에서 제외", () => {
  const b = bld("cattle", { animalOpenArea: 2500 });
  expect(st(evaluateAt(b, "2012-02-04"), "afd")).toBe(STATUS.REQ);
  expect(st(evaluateAt(b, "2012-02-05"), "afd")).toBe(STATUS.NONE);
  expect(st(evaluateAt(bld("cattle", { animalOpenArea: 1000 }), "2026-11-17"), "afd")).toBe(STATUS.REQ);
});

test("2026.3.1. 지하 주차장 기준 — 원문 확인으로 확정 판정, 비상경보 제외조항 적용", () => {
  const small = (use, f = {}) => ({ action: "new", use, area: 300, gf: 1, bf: 1, floors: floors(1, 1, 150), f: { ugParking: 100, ...f } });
  expect(st(evaluateAt(small("office"), "2026-11-17"), "alarm")).toBe(STATUS.REQ);
  expect(st(evaluateAt(small("warehouse", { nonCombMaterial: true }), "2026-11-17"), "alarm")).toBe(STATUS.NONE);
});

test("연결살수 — 20대 미만 기계식 주차시설은 지붕과 외벽이 있는 경우만", () => {
  const b = (f) => ({ action: "new", use: "office", area: 500, gf: 1, bf: 0, floors: floors(1, 0, 500), f: { mechCars: 10, ...f } });
  expect(st(evaluateAt(b(), "2026-11-17"), "conspk")).toBe(STATUS.REQ);
  expect(st(evaluateAt(b({ mechOpen: true }), "2026-11-17"), "conspk")).toBe(STATUS.NONE);
});
