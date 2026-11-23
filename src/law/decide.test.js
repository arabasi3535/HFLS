// 확인 필요 설비 — 검토자 결정(적용/미적용) 반영(v2.41.0)
import { review, STATUS } from "./engine";
import { safetyReview } from "./safety";
import { inspInstalled } from "./installed";

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

test("자진 스프링클러는 종합점검 대상 판단에서 제외, 대체 설비는 포함(v2.42.1)", () => {
  // 업무시설 3층 800㎡ — 법정 설비만으로는 자체점검 비대상
  const o = review({ action: "new", use: "office", date: "2026-11-23", gf: 3, bf: 0, area: 800, floors: floors([[1, 300], [2, 250], [3, 250]]), f: {} }, "2026-11-23");
  const legal = o.hist.rows.filter((row) => row.status === STATUS.REQ).map((row) => ({ key: row.fac.key, kind: "base" }));
  const withVol = [...legal, { key: "spk", kind: "vol" }, { key: "hydrant", kind: "vol" }];
  const inst = inspInstalled(withVol);
  expect(inst.has("spk")).toBe(false);
  const a = safetyReview(o, "new", new Map(), inspInstalled(legal));
  const b = safetyReview(o, "new", new Map(), inst);
  expect(b.insp.summary).toBe(a.insp.summary);
  expect(b.grade.grade).toBe(a.grade.grade);
  // 대체: 물분무등 ← 스프링클러(대체 설비 viaKeys)는 설치된 설비로 반영
  const sub = inspInstalled([{ key: "water", kind: "base", sub: { viaKeys: ["spk"], partial: false } }]);
  expect(sub.get("spk")).toBe(true);
  expect(sub.has("water")).toBe(false);
});
