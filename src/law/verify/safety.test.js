// 안전관리 검토(소방안전관리대상물 등급·방염·소방자동차 전용구역) 회귀 테스트
// 기대값: 화재예방법 시행령 별표4, 소방시설법 시행령 제30조, 소방기본법 시행령 제7조의12·법률 제15365호 부칙 제2조
import { review } from "../engine";
import { safetyReview, S } from "../safety";

const T = "2026-11-08";
const fl = (gf, bf, a) => {
  const l = [];
  for (let i = bf; i >= 1; i--) l.push({ level: -i, area: a, windowless: false });
  for (let i = 1; i <= gf; i++) l.push({ level: i, area: a, windowless: false });
  return l;
};
const run = (i, date = T, mode = "new") => {
  const input = { action: "new", bf: 0, occ: "", useArea: "", completed: "", ...i, date, f: { ...(i.f || {}) } };
  const rv = review(input, T);
  return safetyReview(rv, mode);
};

describe("소방안전관리대상물 등급", () => {
  test("아파트 50층 → 특급", () => {
    const r = run({ use: "apt", area: 200000, gf: 50, bf: 3, floors: fl(50, 3, 3700), f: { households: 800 } });
    expect(r.grade.grade).toBe("특급");
    expect(r.grade.status).toBe(S.YES);
  });
  test("아파트 35층(높이 미입력) → 1급, 특급(200m) 확인 필요", () => {
    const r = run({ use: "apt", area: 60000, gf: 35, bf: 2, floors: fl(35, 2, 1600), f: { households: 400 } });
    expect(r.grade.grade).toBe("1급");
    expect(r.grade.status).toBe(S.CHK);
  });
  test("아파트 35층 높이 110m → 1급 확정", () => {
    const r = run({ use: "apt", area: 60000, gf: 35, bf: 2, floors: fl(35, 2, 1600), f: { households: 400, height: 110 } });
    expect(r.grade.grade).toBe("1급");
    expect(r.grade.status).toBe(S.YES);
  });
  test("업무시설 지상 28층 + 지하 2층 = 30층 → 특급", () => {
    const r = run({ use: "office", area: 60000, gf: 28, bf: 2, floors: fl(28, 2, 2000), f: { height: 115 } });
    expect(r.grade.grade).toBe("특급");
  });
  test("업무시설 연면적 10만㎡ 이상 → 특급", () => {
    const r = run({ use: "office", area: 120000, gf: 10, bf: 3, floors: fl(10, 3, 9230) });
    expect(r.grade.grade).toBe("특급");
  });
  test("업무시설 연면적 1만5천㎡ 이상(10층) → 1급", () => {
    const r = run({ use: "office", area: 16000, gf: 8, bf: 2, floors: fl(8, 2, 1600) });
    expect(r.grade.grade).toBe("1급");
    expect(r.grade.status).toBe(S.YES);
  });
  test("업무시설 지상 11층 7,000㎡ → 1급", () => {
    const r = run({ use: "office", area: 7000, gf: 11, bf: 0, floors: fl(11, 0, 636) });
    expect(r.grade.grade).toBe("1급");
  });
  test("동·식물원은 특급 범위도 제외(별표4 비고) — 연면적 12만㎡여도 특급·1급 아님", () => {
    const r = run({ use: "zoo", area: 120000, gf: 2, bf: 0, floors: fl(2, 0, 60000) });
    expect(["특급", "1급"]).not.toContain(r.grade.grade);
    expect(r.grade.status).not.toBe(S.CHK);
  });
  test("의무관리대상 공동주택(공동주택관리법 제2조①2) → 2급 기준 해당 여부", () => {
    const mm = (f) =>
      run({ use: "row", area: 2000, gf: 4, bf: 0, floors: fl(4, 0, 500), f }).grade.levels[2].hit.some((c) => c.text.includes("의무관리대상"));
    expect(mm({ households: 300 })).toBe(true);
    expect(mm({ households: 150, elevator: true })).toBe(true);
    expect(mm({ households: 150, centralHeat: true })).toBe(true);
    expect(mm({ households: 299 })).toBe(false);
    expect(mm({ households: 120, mmConsent: true })).toBe(true);
    expect(run({ use: "row", area: 2000, gf: 4, bf: 0, floors: fl(4, 0, 500), f: { households: 300 } }).grade.grade).toBe("2급");
  });
  test("동·식물원은 1급 범위 제외 — 연면적 2만㎡여도 1급 아님", () => {
    const r = run({ use: "zoo", area: 20000, gf: 2, bf: 0, floors: fl(2, 0, 10000) });
    expect(r.grade.grade).not.toBe("1급");
    expect(r.grade.grade).not.toBe("특급");
  });
  test("업무시설 7,000㎡ 7층(옥내소화전·스프링클러) → 2급", () => {
    const r = run({ use: "office", area: 7000, gf: 7, bf: 0, floors: fl(7, 0, 1000) });
    expect(r.grade.grade).toBe("2급");
  });
  test("근린생활시설 900㎡ 3층(자동화재탐지설비) → 3급", () => {
    const r = run({ use: "neigh", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) });
    expect(r.grade.grade).toBe("3급");
    expect(r.grade.status).toBe(S.YES);
  });
  test("다세대주택(주택전용 간이스프링클러만) → 소방안전관리대상물 아님", () => {
    const r = run({ use: "multi", area: 600, gf: 4, bf: 0, floors: fl(4, 0, 150), f: { households: 8 } });
    expect(r.grade.grade).toBe("");
    expect(r.grade.status).toBe(S.NO);
  });
  test("보물·국보 목조건축물 → 2급 이상", () => {
    const r = run({ use: "heritage", area: 300, gf: 1, bf: 0, floors: fl(1, 0, 300) });
    expect(["2급", "1급", "특급"]).toContain(r.grade.grade);
  });
  test("가스시설 가연성 가스 1,200톤 → 1급 / 300톤 → 2급 / 미입력 → 확인 필요", () => {
    const base = { use: "gas", area: 500, gf: 1, bf: 0, floors: fl(1, 0, 500) };
    expect(run({ ...base, f: { gasTon: 1200, gasTankTon: 1200 } }).grade.grade).toBe("1급");
    expect(run({ ...base, f: { gasTon: 300, gasTankTon: 300 } }).grade.grade).toBe("2급");
    expect(run({ ...base, f: { gasTankTon: 300 } }).grade.status).toBe(S.CHK);
  });
  test("공공기관 → 소방안전관리대상물 제외(해당없음)", () => {
    const r = run({ use: "office", area: 7000, gf: 11, bf: 0, floors: fl(11, 0, 636), f: { publicOrg: true } });
    expect(r.grade.status).toBe(S.NA);
  });
  test("단독주택 → 해당없음", () => {
    expect(run({ use: "house", area: 150, gf: 2, bf: 0, floors: fl(2, 0, 75) }).grade.status).toBe(S.NA);
  });
});

describe("등급 — '설치해야 하는 설비' = 현행 기준 대상 ∩ (당시 설치 의무 또는 소급·강화기준 적용)", () => {
  const mk = (i, date) => review({ action: "new", bf: 0, occ: "", useArea: "", completed: "", ...i, date, f: { ...(i.f || {}) } }, T);
  test("완화: 교육연구시설 1,500㎡ — 당시 자탐 대상이어도 현행 미대상이면 3급 아님", () => {
    const b = { use: "edu", area: 1500, gf: 3, bf: 0, floors: fl(3, 0, 500) };
    const rv = mk(b, "2010-01-01");
    const hAfd = rv.hist.byKey.afd.status;
    const cAfd = rv.curr.byKey.afd.status;
    expect(cAfd).toBe("해당없음");
    const g = safetyReview(rv, "existing").grade;
    expect(g.grade).not.toBe("3급");
    if (hAfd === "설치") expect(g.notes.join(" ")).toMatch("허가 당시 기준으로는");
  });
  test("강화: 현행 기준에만 있는 시설 — 소급 안 하면 제외, 강화기준 적용하면 반영", () => {
    // 근린생활시설 900㎡(현행 자탐 대상, 3급)를 기준으로, 허가 당시 자탐이 없던 경우를 가정
    const rv0 = mk({ use: "neigh", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) }, "2020-01-01");
    expect(rv0.curr.byKey.afd.status).toBe("설치");
    const none = { ...rv0.hist.byKey.afd, status: "해당없음", hits: [], maybes: [], checks: [] };
    const rv = { ...rv0, hist: { ...rv0.hist, byKey: { ...rv0.hist.byKey, afd: none } } };
    expect(safetyReview(rv, "existing", new Map()).grade.grade).toBe("");
    expect(safetyReview(rv, "existing", new Map([["afd", true]])).grade.grade).toBe("3급");
  });
});

describe("방염 대상(시행령 제30조)", () => {
  test("치과의원·한의원 → 대상 + 소급 없음(2024.12.31. 이후 설치·교체분)", () => {
    const b = { use: "clinic", area: 300, gf: 2, bf: 0, floors: fl(2, 0, 150) };
    const d = run({ ...b, f: { clinicType: "dental" } }).flame;
    expect(d.status).toBe(S.YES);
    expect(d.hits[0].noRetro).toMatch("2024.12.31.");
    expect(run({ ...b, f: { clinicType: "oriental" } }).flame.hits[0].noRetro).toMatch("2024.12.31.");
  });
  test("조산원 → 소급 없음 표시 / 산후조리원 → 표시 없음(다중이용업)", () => {
    const b = { use: "midwife", area: 300, gf: 2, bf: 0, floors: fl(2, 0, 150) };
    expect(run({ ...b, f: { midwifeType: "midwife" } }).flame.hits[0].noRetro).toBeTruthy();
    expect(run({ ...b, f: { midwifeType: "postnatal" } }).flame.hits[0].noRetro).toBeUndefined();
  });
  test("의원 → 대상(제1호)", () => {
    const r = run({ use: "clinic", area: 300, gf: 2, bf: 0, floors: fl(2, 0, 150) });
    expect(r.flame.status).toBe(S.YES);
    expect(r.flame.hits[0].no).toBe("제1호");
  });
  test("일반 근린생활시설 3층 → 비대상, 체력단련장 체크 → 대상", () => {
    const b = { use: "neigh", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) };
    expect(run(b).flame.status).toBe(S.NO);
    expect(run({ ...b, f: { neighFlame: "gym" } }).flame.status).toBe(S.YES);
    expect(run({ ...b, f: { neighFlame: "gym" } }).flame.hits[0].noRetro).toBeUndefined();
    expect(run({ ...b, f: { neighFlame: "perf" } }).flame.hits[0].noRetro).toBeTruthy();
  });
  test("운동시설 → 대상, 수영장 → 비대상", () => {
    const b = { use: "sports", area: 900, gf: 2, bf: 0, floors: fl(2, 0, 450), occ: 50, f: { stageArea: 0 } };
    expect(run(b).flame.status).toBe(S.YES);
    expect(run({ ...b, f: { stageArea: 0, poolOnly: true } }).flame.status).toBe(S.NO);
  });
  test("노유자·숙박·의료 → 대상", () => {
    expect(run({ use: "noyu", area: 300, gf: 1, bf: 0, floors: fl(1, 0, 300) }).flame.status).toBe(S.YES);
    expect(run({ use: "lodging", area: 500, gf: 3, bf: 0, floors: fl(3, 0, 166.67) }).flame.status).toBe(S.YES);
    expect(run({ use: "hosp", area: 2000, gf: 4, bf: 0, floors: fl(4, 0, 500) }).flame.status).toBe(S.YES);
  });
  test("업무시설 11층 → 대상(제10호), 10층 → 비대상", () => {
    expect(run({ use: "office", area: 7000, gf: 11, bf: 0, floors: fl(11, 0, 636) }).flame.hits[0].no).toBe("제10호");
    expect(run({ use: "office", area: 7000, gf: 10, bf: 0, floors: fl(10, 0, 700) }).flame.status).toBe(S.NO);
  });
  test("아파트 20층 → 비대상(아파트등 제외)", () => {
    expect(run({ use: "apt", area: 30000, gf: 20, bf: 2, floors: fl(20, 2, 1360), f: { households: 200 } }).flame.status).toBe(S.NO);
  });
  test("다중이용업소 영업장 → 대상(제9호)", () => {
    const r = run({ use: "neigh", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300), f: { multiUse: true } });
    expect(r.flame.hits.map((h) => h.no)).toContain("제9호");
  });
  test("교육연구시설 기숙사·합숙소 미구분 → 확인 필요", () => {
    expect(run({ use: "edu_dorm", area: 600, gf: 3, bf: 0, floors: fl(3, 0, 200) }).flame.status).toBe(S.CHK);
    const h = run({ use: "edu_dorm", area: 600, gf: 3, bf: 0, floors: fl(3, 0, 200), f: { eduDormType: "hapsuk" } }).flame;
    expect(h.status).toBe(S.YES);
    expect(h.hits[0].noRetro).toBeTruthy();
  });
});

describe("소방자동차 전용구역(소방기본법 제21조의2)", () => {
  const apt = (hh, f = {}) => ({ use: "apt", area: 30000, gf: 20, bf: 2, floors: fl(20, 2, 1360), f: { households: hh, ...f } });
  test("신축 아파트 100세대 → 대상 / 99세대 → 비대상 / 미입력 → 확인 필요", () => {
    expect(run(apt(100)).lane.status).toBe(S.YES);
    expect(run(apt(99)).lane.status).toBe(S.NO);
    expect(run(apt("")).lane.status).toBe(S.CHK);
  });
  test("기숙사 3층 → 대상 / 2층 → 비대상", () => {
    expect(run({ use: "dorm", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) }).lane.status).toBe(S.YES);
    expect(run({ use: "dorm", area: 600, gf: 2, bf: 0, floors: fl(2, 0, 300) }).lane.status).toBe(S.NO);
  });
  test("기존 아파트: 2018.8.9. 신청 → 비대상 / 2018.8.10. → 신청일 확인 / 2019.3.1. → 대상", () => {
    expect(run(apt(300), "2018-08-09", "existing").lane.status).toBe(S.NO);
    expect(run(apt(300), "2018-08-10", "existing").lane.status).toBe(S.CHK);
    expect(run(apt(300), "2019-03-01", "existing").lane.status).toBe(S.YES);
  });
  test("시행령 제7조의12 단서(1개 동·편도 2차선 도로 직접 접함) → 비대상", () => {
    expect(run(apt(150, { laneException: true })).lane.status).toBe(S.NO);
  });
  test("교육연구시설 내 학교 기숙사 3층 → 대상 / 합숙소 → 비대상 / 미선택 → 확인 필요", () => {
    const b = { use: "edu_dorm", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) };
    expect(run({ ...b, f: { eduDormType: "dorm" } }).lane.status).toBe(S.YES);
    expect(run({ ...b, f: { eduDormType: "hapsuk" } }).lane.status).toBe(S.NO);
    expect(run(b).lane.status).toBe(S.CHK);
  });
  test("업무시설 → 비대상", () => {
    expect(run({ use: "office", area: 7000, gf: 7, bf: 0, floors: fl(7, 0, 1000) }).lane.status).toBe(S.NO);
  });
});
