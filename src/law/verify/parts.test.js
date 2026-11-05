// 증축·용도변경 부분별 판정, 부칙 소급 완공일, 현행 비교 판정 불가 — 회귀 테스트
import { review, STATUS } from "../engine";

const fl = (gf, bf, a) => {
  const l = [];
  for (let i = bf; i >= 1; i--) l.push({ level: -i, area: a, windowless: false });
  for (let i = 1; i <= gf; i++) l.push({ level: i, area: a, windowless: false });
  return l;
};
const T = "2026-11-06";

describe("용도변경 — 기존 부분(변경 전 용도)과 변경 부분(변경 후 용도·면적) 분리", () => {
  const input = {
    action: "usechange", date: "2010-01-01", date2: "2023-03-01", use: "lodging", prevUse: "office", changeArea: 300,
    area: 3000, gf: 5, bf: 0, floors: fl(5, 0, 600), f: {}, extExceptions: {},
  };
  const rv = review(input, T);
  test("기존 부분은 업무시설로 판정(숙박시설 기준 미적용)", () => {
    expect(rv.hist.u.id).toBe("office");
    expect(rv.hist.byKey.sspk.status).toBe(STATUS.NONE);
    expect(rv.hist.byKey.afd.status).toBe(STATUS.REQ); // 업무 1,000㎡
  });
  test("변경 부분은 숙박시설·300㎡로 판정 → 간이스프링클러(300~600㎡)", () => {
    expect(rv.secondary.date).toBe("2023-03-01");
    expect(rv.second.byKey.sspk.status).toBe(STATUS.REQ);
    expect(rv.second.byKey.spk.status).toBe(STATUS.NONE);
  });
  test("변경 전 용도 미선택 시 경고", () => {
    const r2 = review({ ...input, prevUse: "" }, T);
    expect(r2.issues.join(" ")).toMatch(/변경 전 용도/);
  });
  test("단서(위험 감소) 해당 → 전체를 변경 전 용도·최초 기준일로", () => {
    const r3 = review({ ...input, useChangeReduce: true }, T);
    expect(r3.primaryDate).toBe("2010-01-01");
    expect(r3.hist.u.id).toBe("office");
    expect(r3.second).toBeNull();
  });
});

describe("증축 — 구획 예외 시 기존 부분은 증축 전 규모로", () => {
  const input = {
    action: "extension", date: "2010-01-01", date2: "2023-03-01", use: "office", area: 4000, gf: 4, bf: 0, floors: fl(4, 0, 1000),
    prevArea: 2000, prevGf: 2, prevBf: 0, f: {}, extExceptions: { fireproof: true },
  };
  const rv = review(input, T);
  test("기존 부분 판정에 증축 전 연면적 2,000㎡ 사용", () => {
    expect(rv.hist.x.area).toBe(2000);
    expect(rv.hist.x.gf).toBe(2);
  });
  test("증축 부분은 증축 후 전체 규모(4,000㎡)로 판단", () => {
    expect(rv.second.x.area).toBe(4000);
    expect(rv.second.byKey.hydrant.status).toBe(STATUS.REQ);
  });
  test("증축 전 규모 미입력 시 경고", () => {
    const r2 = review({ ...input, prevArea: "", prevGf: "" }, T);
    expect(r2.issues.join(" ")).toMatch(/증축 전/);
  });
});

describe("부칙 소급 — 시행 당시 건축 완료 여부(사용승인일)", () => {
  const base = { action: "new", use: "hosp", area: 1000, gf: 2, bf: 0, floors: fl(2, 0, 500), f: {} };
  test("2018 신청·2020 사용승인 병원 → 2019 소급 제외", () => {
    const rv = review({ ...base, date: "2018-01-01", completed: "2020-03-01" }, T);
    expect(rv.retro.map((r) => r.id)).not.toContain("retro-hosp2019");
    expect(rv.retroExcluded.length).toBe(1);
  });
  test("2018 신청·2019.1. 사용승인 병원 → 2019 소급 대상", () => {
    const rv = review({ ...base, date: "2018-01-01", completed: "2019-01-15" }, T);
    expect(rv.retro.map((r) => r.id)).toContain("retro-hosp2019");
    expect(rv.retro[0].needsCompletion).toBe(false);
  });
  test("사용승인일 미입력 → 후보 표시 + 완공일 확인 안내", () => {
    const rv = review({ ...base, date: "2018-01-01" }, T);
    expect(rv.retro.find((r) => r.id === "retro-hosp2019").needsCompletion).toBe(true);
  });
});

describe("현행 비교 — 한쪽이 확인 필요면 강화·완화 확정 안 함", () => {
  test("2012 공동주택 내 비노인 생활시설(확인 필요) vs 현행(해당없음) → 비교 판정 불가", () => {
    const rv = review({ action: "new", use: "noyu_res2", date: "2012-06-01", area: 200, useArea: 200, gf: 1, bf: 0, floors: fl(1, 0, 200), f: { noyuInHouse: true } }, T);
    const cmp = rv.compare.find((c) => c.fac.key === "afd");
    expect(cmp.h).toBe(STATUS.CHK);
    expect(cmp.kind).toBe("unknown");
  });
});

describe("미입력 선택값은 0이 아닌 확인 필요", () => {
  const ev = (input, d = T) => review({ action: "new", date: d, ...input }, T).hist;
  test("공연장 무대부 미입력 → 스프링클러 확인 필요 / 500㎡ 입력 → 설치 / 0 입력 → 해당없음", () => {
    const b = { use: "perf", area: 800, gf: 1, bf: 0, occ: 50, floors: fl(1, 0, 800) };
    expect(ev({ ...b, f: {} }).byKey.spk.status).toBe(STATUS.CHK);
    expect(ev({ ...b, f: { stageArea: 500 } }).byKey.spk.status).toBe(STATUS.REQ);
    expect(ev({ ...b, f: { stageArea: 0 } }).byKey.spk.status).toBe(STATUS.NONE);
  });
  test("공장 특수가연물 미입력 → 옥내소화전 확인 필요 / 750배 → 설치", () => {
    const b = { use: "factory", area: 800, gf: 1, bf: 0, floors: fl(1, 0, 800) };
    expect(ev({ ...b, f: {} }).byKey.hydrant.status).toBe(STATUS.CHK);
    expect(ev({ ...b, f: { combustibleTimes: 750 } }).byKey.hydrant.status).toBe(STATUS.REQ);
  });
  test("가스시설 탱크 미입력 → 연결살수 확인 필요 / 30톤 → 설치", () => {
    const b = { use: "gas", area: 100, gf: 1, bf: 0, floors: fl(1, 0, 100) };
    expect(ev({ ...b, f: {} }).byKey.conspk.status).toBe(STATUS.CHK);
    expect(ev({ ...b, f: { gasTankTon: 30 } }).byKey.conspk.status).toBe(STATUS.REQ);
  });
  test("판매시설 1,000㎡ 수용인원 미입력 → 별표7(÷3㎡) 상한 333명 → 스프링클러 500명 기준 해당없음", () => {
    const b = { use: "retail", area: 1000, gf: 1, bf: 0, floors: fl(1, 0, 1000), f: {} };
    expect(ev(b).byKey.spk.status).toBe(STATUS.NONE);
  });
});
