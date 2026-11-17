// 동물 및 식물 관련 시설 — 「사람이 거주하지 않음 / 벽이 없음」 체크에 따른 비상경보·비상방송설비·비상조명등 제외(시기별)
import { evaluateAt, STATUS } from "./engine";

const floors = (gf, bf, area, wl = []) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: wl.includes(i) });
  return list;
};
const st = (r, k) => r.byKey[k].status;
const bld = (use, f = {}, o = {}) => ({ action: "new", use, area: 600, gf: 1, bf: 0, floors: floors(1, 0, 600), f, ...o });

describe("비상경보설비(alarm)", () => {
  test("체크 안 하면 축사도 연면적 400㎡ 이상 → 설치", () => {
    for (const d of ["2004-06-01", "2010-01-01", "2020-01-01", "2026-11-17"]) expect(st(evaluateAt(bld("cattle"), d), "alarm")).toBe(STATUS.REQ);
  });
  test("사람 거주 않는 축사: 2005.11.11. 전 설치 / 이후 연면적 기준 제외", () => {
    const b = bld("cattle", { animalNoResid: true });
    expect(st(evaluateAt(b, "2005-11-10"), "alarm")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2005-11-11"), "alarm")).toBe(STATUS.NONE);
    expect(st(evaluateAt(b, "2026-11-17"), "alarm")).toBe(STATUS.NONE);
  });
  test("축사가 아닌 동·식물 관련 시설은 2016.7.1.부터 제외", () => {
    const b = bld("animal", { animalNoWall: true });
    expect(st(evaluateAt(b, "2016-06-30"), "alarm")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2016-07-01"), "alarm")).toBe(STATUS.NONE);
  });
  test("지하층 150㎡: 2022.11.30.까지는 제외 안 됨 → 2022.12.1.부터 전체 제외", () => {
    const b = bld("cattle", { animalNoWall: true }, { area: 300, gf: 1, bf: 1, floors: floors(1, 1, 150) });
    expect(st(evaluateAt(b, "2022-11-30"), "alarm")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2022-12-01"), "alarm")).toBe(STATUS.NONE);
  });
});

describe("비상방송설비(pa)", () => {
  const big = (use, f) => bld(use, f, { area: 4000, gf: 2, floors: floors(2, 0, 2000) });
  test("축사: 2013.2.10.~2022.11.30. 조건 없이 제외, 2022.12.1.부터는 체크해야 제외", () => {
    expect(st(evaluateAt(big("cattle"), "2010-01-01"), "pa")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("cattle"), "2013-02-10"), "pa")).toBe(STATUS.NONE);
    expect(st(evaluateAt(big("cattle"), "2022-12-01"), "pa")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("cattle", { animalNoWall: true }), "2022-12-01"), "pa")).toBe(STATUS.NONE);
  });
  test("2009.2.6.~2022.11.30.은 「사람이 거주하지 않는」 것만(벽 없음은 해당 없음)", () => {
    expect(st(evaluateAt(big("animal", { animalNoResid: true }), "2009-02-05"), "pa")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("animal", { animalNoResid: true }), "2009-02-06"), "pa")).toBe(STATUS.NONE);
    expect(st(evaluateAt(big("animal", { animalNoWall: true }), "2015-01-01"), "pa")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big("animal", { animalNoWall: true }), "2022-12-01"), "pa")).toBe(STATUS.NONE);
  });
});

describe("비상조명등(elight)", () => {
  const big = (f) => bld("cattle", f, { area: 3500, gf: 5, floors: floors(5, 0, 700) });
  test("2022.11.30.까지는 축사도 제외 없음, 2022.12.1.부터 체크 시 제외", () => {
    expect(st(evaluateAt(big({ animalNoResid: true }), "2022-11-30"), "elight")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big({}), "2026-11-17"), "elight")).toBe(STATUS.REQ);
    expect(st(evaluateAt(big({ animalNoResid: true }), "2022-12-01"), "elight")).toBe(STATUS.NONE);
  });
});

describe("비상경보설비 — 모래·석재 등 불연재료 공장·창고", () => {
  const ck = { nonCombMaterial: true };
  test("창고: 2016.7.1.부터 제외", () => {
    expect(st(evaluateAt(bld("warehouse", ck), "2016-06-30"), "alarm")).toBe(STATUS.REQ);
    expect(st(evaluateAt(bld("warehouse", ck), "2016-07-01"), "alarm")).toBe(STATUS.NONE);
    expect(st(evaluateAt(bld("warehouse"), "2026-11-17"), "alarm")).toBe(STATUS.REQ);
  });
  test("공장: 2022.12.1.부터 제외", () => {
    expect(st(evaluateAt(bld("factory", ck), "2022-11-30"), "alarm")).toBe(STATUS.REQ);
    expect(st(evaluateAt(bld("factory", ck), "2022-12-01"), "alarm")).toBe(STATUS.NONE);
  });
});
