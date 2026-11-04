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
    chkDiff: chk.filter((k) => !echk.includes(k)),
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
