// 검증 사례 회귀 테스트 — 기대값(법령 원문·운영매뉴얼 기준)과 판정 결과가 다르면 실패
import fs from "fs";
import { evaluateAt, STATUS } from "../engine";
import { CASES, EXTRA } from "./cases30";

function check(c) {
  const r = evaluateAt({ action: "new", ...c.i, f: { ...(c.i.f || {}) } }, c.d);
  const by = (s) => r.rows.filter((x) => x.status === s).map((x) => x.fac.key);
  const sys = [...by(STATUS.REQ), ...by(STATUS.REQ_CHK)];
  const chk = by(STATUS.CHK);
  const echk = c.chk || [];
  return {
    id: c.id,
    t: c.t,
    missing: c.exp.filter((k) => !sys.includes(k)),
    extra: sys.filter((k) => !c.exp.includes(k)),
    chkDiff: [...chk.filter((k) => !echk.includes(k)), ...echk.filter((k) => !chk.includes(k)).map((k) => k + "(기대한 확인필요 누락)")],
    reqchk: by(STATUS.REQ_CHK),
  };
}

const all = [...CASES, ...EXTRA];
const results = all.map(check);
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(results, null, 1));

describe("검증 사례(법령 원문·운영매뉴얼 대조)", () => {
  test.each(results.map((r) => [r.id + " " + r.t, r]))("%s", (_, r) => {
    expect({ 누락: r.missing, 과잉: r.extra, 확인필요: r.chkDiff }).toEqual({ 누락: [], 과잉: [], 확인필요: [] });
  });
});

describe("내부 차고·지하 주차장 입력(v2.14.5)", () => {
  const base = { action: "new", date: "", grp: "2", use: "neigh", area: "3000", gf: "3", bf: "1", occ: "", useArea: "", floors: [], completed: "", extExceptions: {} };
  test("지하 차고만 입력해도 내부 차고 200㎡ 기준(물분무등) 판단", () => {
    const rv = evaluateAt({ ...base, f: { ugParking: "300" } }, "2026-11-08");
    const w = rv.byKey.water;
    expect(w.hits.map((h) => h.id)).toContain("wat-inpark");
  });
  test("내부 차고 합계 + 전기실 → 물분무등 근거 두 개", () => {
    const rv = evaluateAt({ ...base, f: { parkingInside: "300", elecRoom: "400" } }, "2026-11-08");
    const ids = rv.byKey.water.hits.map((h) => h.id);
    expect(ids).toContain("wat-inpark");
    expect(ids).toContain("wat-elec");
  });
});
