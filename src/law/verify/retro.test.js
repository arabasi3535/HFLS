// 부칙 소급 — 부칙 시행일 기준(개정규정)으로 실제 설치 시설을 정하는지 회귀 테스트
import { review, STATUS } from "../engine";

const fl = (gf, a) => Array.from({ length: gf }, (_, i) => ({ level: i + 1, area: a, windowless: false }));
const T = "2026-11-06";
const base = (use, date, gf, a, f = {}) => ({ action: "new", date, use, area: gf * a, gf, bf: 0, floors: fl(gf, a), f, extExceptions: {} });
const req = (rr, k) => {
  const s = rr.atStatus.find((x) => x.k === k);
  return s && (s.st === STATUS.REQ || s.st === STATUS.REQ_CHK);
};

describe("요양병원 2015.7.1. 부칙 제3조(대통령령 제26370호)", () => {
  test("2014 허가 1,000㎡ → 소급 대상, 스프링클러(600㎡ 이상)·자탐·속보", () => {
    const rv = review(base("nursing", "2014-03-01", 2, 500), T);
    const r = rv.retro.find((x) => x.id === "retro-nursing2015");
    expect(r).toBeTruthy();
    expect(r.deadline).toBe("2018-06-30");
    expect(req(r, "spk")).toBe(true);
    expect(req(r, "afd")).toBe(true);
    expect(req(r, "report")).toBe(true);
  });
  test("2014 허가 400㎡ → 간이스프링클러(600㎡ 미만), 스프링클러 아님", () => {
    const rv = review(base("nursing", "2014-03-01", 1, 400), T);
    const r = rv.retro.find((x) => x.id === "retro-nursing2015");
    expect(req(r, "sspk")).toBe(true);
    expect(req(r, "spk")).toBe(false);
  });
  test("2016 허가 → 소급 대상 아님", () => {
    const rv = review(base("nursing", "2016-03-01", 1, 400), T);
    expect(rv.retro.find((x) => x.id === "retro-nursing2015")).toBeFalsy();
  });
  test("사용승인일이 2015.7.1. 이후면 제외", () => {
    const rv = review({ ...base("nursing", "2014-03-01", 1, 400), completed: "2015-09-01" }, T);
    expect(rv.retro.find((x) => x.id === "retro-nursing2015")).toBeFalsy();
    expect(rv.retroExcluded.length).toBe(1);
  });
});

describe("노유자 생활시설 2012 부칙", () => {
  test("2010 허가 노인요양 300㎡ → 간이SPK·자탐·속보 소급", () => {
    const rv = review(base("noyu_res", "2010-05-01", 1, 300), T);
    const r = rv.retro.find((x) => x.id === "retro-noyu2012");
    expect(r).toBeTruthy();
    expect(req(r, "sspk")).toBe(true);
    expect(req(r, "afd")).toBe(true);
    expect(req(r, "report")).toBe(true);
  });
});

describe("병원 2019 부칙", () => {
  test("2018 허가 병원 500㎡ → 간이SPK(600㎡ 미만)·속보, 스프링클러 아님", () => {
    const rv = review(base("hosp", "2018-03-01", 1, 500), T);
    const r = rv.retro.find((x) => x.id === "retro-hosp2019");
    expect(req(r, "sspk")).toBe(true);
    expect(req(r, "spk")).toBe(false);
    expect(req(r, "report")).toBe(true);
  });
});
