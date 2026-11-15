// 전 용도 × 규모 × 신축/기존 허가일 조합에서 판정·안전관리 검토가 예외 없이 끝나는지(스모크)
import { review, toCSV } from "../engine";
import { USES } from "../uses";
import { safetyReview } from "../safety";

const SIZES = [
  { area: 150, gf: 1, bf: 0 },
  { area: 3000, gf: 5, bf: 1 },
  { area: 16000, gf: 12, bf: 2 },
  { area: 120000, gf: 35, bf: 5 },
];
const DATES = ["2026-11-15", "2015-03-01", "2008-01-01", "1995-06-01"];

describe("스모크 — 전 용도 판정 예외 없음", () => {
  test("모든 용도·규모·허가일", () => {
    let n = 0;
    for (const u of USES) {
      for (const s of SIZES) {
        for (const d of DATES) {
          const mode = d === "2026-11-15" ? "new" : "existing";
          const inp = { use: u.id, action: "new", f: {}, floors: [], ...s, date: d };
          let rv;
          expect(() => {
            rv = review(inp, "2026-11-15");
          }).not.toThrow();
          if (!rv) continue;
          expect(() => safetyReview(rv, mode)).not.toThrow();
          expect(() => toCSV(rv)).not.toThrow();
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(USES.length * 8);
  });
});
