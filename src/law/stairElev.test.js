// (v2.49.2) 건축법령상 특별피난계단·비상용(피난용) 승강기 대상 → 제연설비 「확인 필요」
import { evaluateAt, STATUS } from "./engine";
import { stairElevReasons } from "./criteria";
import { derive } from "./logic";
import { getUse } from "./uses";

const fl = (gf, bf, a) => [...Array.from({ length: bf }, (_, i) => ({ level: -(bf - i), area: String(a) })), ...Array.from({ length: gf }, (_, i) => ({ level: i + 1, area: String(a) }))];
const ctxOf = (inp) => {
  const u = getUse(inp.use);
  return { u, x: derive(inp, u), f: inp.f || {}, g: (...k) => k.some((kk) => u.g.includes(kk)) };
};
const smoke = (inp, d = "2026-11-24") => evaluateAt({ action: "new", ...inp }, d).rows.find((r) => r.fac.key === "smoke");

test("11층 이상 업무시설(각 층 400㎡ 이상) — 특별피난계단·비상용승강기 사유 → 제연설비 확인 필요, 체크하면 설치 대상", () => {
  const inp = { use: "office", area: 6000, gf: 12, bf: 0, floors: fl(12, 0, 500), f: { height: "40" } };
  const why = stairElevReasons(ctxOf(inp));
  expect(why.some((t) => t.includes("11층 이상") && t.includes("제35조제2항"))).toBe(true);
  expect(why.some((t) => t.includes("높이 40m"))).toBe(true);
  const r = smoke(inp);
  expect(r.status).toBe(STATUS.CHK);
  expect(r.checks.find((c) => c.id === "sm-stair").why).toContain("「적용」");
  expect(smoke({ ...inp, f: { specialStairs: true } }).status).toBe(STATUS.REQ);
  expect(smoke({ ...inp, dec: { smoke: false } }).status).toBe(STATUS.NONE);
});

test("공동주택은 16층 기준, 11층 이상 층이 모두 400㎡ 미만이면 특별피난계단 사유 아님, 갓복도형 아파트 제외", () => {
  const apt12 = { use: "apt", area: 4000, gf: 12, bf: 0, floors: fl(12, 0, 300), f: {} };
  const why = stairElevReasons(ctxOf(apt12));
  expect(why.some((t) => t.includes("특별피난계단"))).toBe(false);
  expect(why.some((t) => t.includes("주택건설기준"))).toBe(true); // 10층 이상 공동주택
  const off = { use: "office", area: 3600, gf: 12, bf: 0, floors: fl(12, 0, 300), f: { height: "30" } };
  expect(stairElevReasons(ctxOf(off))).toEqual([]);
  expect(smoke(off).status).toBe(STATUS.NONE);
  expect(smoke({ ...apt12, f: { corridorApt: true } }).status).toBe(STATUS.NONE);
});

test("지하 3층 이하 400㎡ 이상, 판매시설 5층 이상, 고층건축물(30층·120m)", () => {
  expect(stairElevReasons(ctxOf({ use: "office", area: 3000, gf: 3, bf: 3, floors: fl(3, 3, 500), f: {} }))[0]).toContain("지하 3층 이하");
  expect(stairElevReasons(ctxOf({ use: "retail", area: 3000, gf: 5, bf: 0, floors: fl(5, 0, 600), f: {} })).some((t) => t.includes("제35조제3항"))).toBe(true);
  expect(stairElevReasons(ctxOf({ use: "office", area: 90000, gf: 30, bf: 0, floors: fl(30, 0, 3000), f: { height: "125" } })).some((t) => t.includes("피난용승강기"))).toBe(true);
});
