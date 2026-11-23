// 확인 필요 설비 — 검토자 결정(적용/미적용) 반영(v2.41.0)
import { review, STATUS } from "./engine";
import { safetyReview } from "./safety";

const floors = (list) => list.map(([level, area]) => ({ level, area, windowless: false }));
const base = { action: "new", use: "religion", date: "2026-11-23", gf: 3, bf: 0, area: 1474.82, floors: floors([[1, 259.72], [2, 765.85], [3, 449.25]]), f: { parkingInside: 981 } };
const rv = (o = {}) => review({ ...base, ...o }, "2026-11-23");

test("결정 없으면 스프링클러설비 확인 필요", () => {
  expect(rv().hist.byKey.spk.status).toBe(STATUS.CHK);
});

test("적용 → 설치, 결정 표시·근거(checks) 유지, 물분무등 ← 스프링클러 대체 후보로 이어짐", () => {
  const r = rv({ dec: { spk: true } });
  const row = r.hist.byKey.spk;
  expect(row.status).toBe(STATUS.REQ);
  expect(row.decided).toBe(true);
  expect(row.checks.length).toBeGreaterThan(0);
  expect(r.curr.byKey.spk.status).toBe(STATUS.REQ);
});

test("미적용 → 해당없음, 안전관리 등급 판정에도 반영", () => {
  const r = rv({ dec: { spk: false, smoke: false } });
  expect(r.hist.byKey.spk.status).toBe(STATUS.NONE);
  expect(r.hist.byKey.spk.decided).toBe(false);
  expect(r.hist.byKey.smoke.status).toBe(STATUS.NONE);
  const sv = safetyReview(r, "new");
  expect(sv.grade).toBeTruthy();
});

test("이미 판정되는 설비(설치·해당없음)에는 결정이 영향 없음", () => {
  const r = rv({ dec: { afd: false, hydrant: true } });
  expect(r.hist.byKey.afd.status).toBe(STATUS.REQ);
  expect(r.hist.byKey.afd.decided).toBeUndefined();
  expect(r.hist.byKey.hydrant.status).toBe(STATUS.NONE);
});

test("자진 스프링클러 → 자체점검 종합점검 대상, 소방안전관리 등급은 그대로(v2.42.0)", () => {
  const r = rv({ dec: { spk: false, smoke: false } });
  const before = safetyReview(r, "new");
  const installed = new Map();
  for (const row of r.hist.rows) if (row.status === STATUS.REQ) installed.set(row.fac.key, true);
  installed.set("spk", true); // 자진
  const after = safetyReview(r, "new", new Map(), installed);
  expect(after.grade.grade).toBe(before.grade.grade);
  expect(after.insp.summary).toMatch(/종합/);
});
