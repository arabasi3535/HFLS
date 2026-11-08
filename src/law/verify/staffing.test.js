import { staffing, r1, scaleOf, checkAssist, unitRule } from "../staffing";

describe("점검인력 배치기준 — 시행규칙 별표4 <2024.11.29.>", () => {
  test("작동점검 근린생활시설 25,000㎡, SP·물분무·제연 미설치 → 25,000×1.0−0.3 = 17,500 ÷ 10,000 = 1.8 → 2일", () => {
    const r = staffing({ comp: false, checker: "mgmt", mode: "bldg", cls: "2", area: 25000, noSpk: true, noWater: true, noSmoke: true, extra: 0 });
    expect(r.areaPts).toBe(17500);
    expect(r.ratio).toBe(1.8);
    expect(r.days).toBe(2);
  });
  test("종합점검 판매시설(1류) 20,000㎡, 보조 2명 추가 → 22,000 ÷ 12,000 = 1.8", () => {
    const r = staffing({ comp: true, checker: "mgmt", mode: "bldg", cls: "1", area: 20000, extra: 2 });
    expect(r.limitA).toBe(12000);
    expect(r.areaPts).toBe(22000);
    expect(r.ratio).toBe(1.8);
    expect(r.days).toBe(2);
  });
  test("아파트 600세대, 제연 미설치, 보조 1명 추가 → 540 ÷ 310 = 1.7 → 2일", () => {
    const r = staffing({ comp: true, checker: "mgmt", mode: "apt", hh: 600, noSmoke: true, extra: 1 });
    expect(r.hhPts).toBe(540);
    expect(r.limitH).toBe(310);
    expect(r.ratio).toBe(1.7);
  });
  test("아파트등+그 외(작동): 200세대×40 + 근생 2,000㎡ = 10,000 ÷ 10,000 = 1.0 → 1일", () => {
    const r = staffing({ comp: false, checker: "mgmt", mode: "mixed", hh: 200, area: 2000, cls: "2" });
    expect(r.ratio).toBe(1);
    expect(r.days).toBe(1);
  });
  test("지하구·터널 환산", () => {
    expect(staffing({ comp: false, checker: "mgmt", mode: "ug", len: 1000, cls: "2" }).areaPts).toBe(1800);
    expect(staffing({ comp: false, checker: "mgmt", mode: "tunnel", len: 1000, lanes: "4", cls: "2" }).areaPts).toBe(7000);
    expect(staffing({ comp: false, checker: "mgmt", mode: "tunnel", len: 1000, lanes: "4", oneSide: true, cls: "2" }).areaPts).toBe(3500);
  });
  test("추가 인원 상한(제1호)", () => {
    expect(unitRule("mgmt").maxExtra).toBe(4);
    expect(unitRule("manager").maxExtra).toBe(2);
    expect(staffing({ comp: false, checker: "manager", mode: "bldg", area: 1000, extra: 5 }).extra).toBe(2);
  });
  test("규모별 배치기준(제2호)", () => {
    expect(scaleOf("특급", false)).toBe("b");
    expect(scaleOf("2급", true)).toBe("a");
    expect(checkAssist("b", ["고급점검자", "초급점검자"]).ok).toBe(true);
    expect(checkAssist("b", ["중급점검자", "초급점검자"]).ok).toBe(false);
    expect(checkAssist("d", ["초급점검자", "초급점검자"]).ok).toBe(true);
  });
  test("반올림(제10호)", () => {
    expect(r1(1.25)).toBe(1.3);
    expect(r1(2.04)).toBe(2);
  });
});
