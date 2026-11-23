// 보조 계산기(무창층·수용인원) 테스트
import { windowlessFloor, openingRow, occupancy } from "../tools";
import { evaluateAt } from "../engine";

describe("무창층 판정(시행령 제2조제1호, 1/30)", () => {
  test("바닥 300㎡ — 개구부 10㎡ 이하 무창층, 초과 유창층", () => {
    expect(windowlessFloor({ level: 2, area: 300, windows: [{ w: 2, h: 1, cnt: 5 }] }).status).toBe("무창층"); // 10 = 300/30
    expect(windowlessFloor({ level: 2, area: 300, windows: [{ w: 2, h: 1, cnt: 5 }, { w: 0.5, h: 0.5, cnt: 1 }] }).status).toBe("유창층");
  });
  test("가로·세로 0.5m 미만 개구부는 제외(지름 50cm 원 내접 불가)", () => {
    expect(openingRow({ w: 0.4, h: 2, cnt: 10 }).counted).toBe(false);
    expect(openingRow({ w: 0.5, h: 0.5, cnt: 1 }).counted).toBe(true);
  });
  test("1층만 문 반영, 2층 이상은 문 무시", () => {
    const doors = [{ w: 1, h: 2, cnt: 2 }];
    expect(windowlessFloor({ level: 1, area: 90, doors, windows: [] }).sum).toBe(4);
    expect(windowlessFloor({ level: 2, area: 90, doors, windows: [] }).sum).toBe(0);
  });
  test("제외 체크 개구부는 합계에서 뺌", () => {
    expect(windowlessFloor({ level: 2, area: 300, windows: [{ w: 3, h: 2, cnt: 2, excluded: true }] }).sum).toBe(0);
  });
});

describe("수용인원(별표7)", () => {
  test("그 밖: (200−20)÷3 = 60", () => expect(occupancy({ type: "etc", area: 200, excl: 20 }).result).toBe(60));
  test("강의실: 100÷1.9 = 52.6 → 53", () => expect(occupancy({ type: "class", area: 100, excl: 0 }).result).toBe(53));
  test("집회: 460÷4.6 = 100", () => expect(occupancy({ type: "hall", area: 460, excl: 0 }).result).toBe(100));
  test("운동시설 관람석: (500−40)÷4.6 + 고정 200석 = 300", () =>
    expect(occupancy({ type: "hall", area: 500, excl: 0, seatArea: 40, fixedSeats: 200 }).result).toBe(300));
  test("긴 의자 9m ÷ 0.45 = 20", () => expect(occupancy({ type: "hall", area: 0, excl: 0, benchWidth: 9 }).result).toBe(20));
  test("침대 숙박: 종사자 3 + 1인용 10 + 2인용 5×2 = 23", () => expect(occupancy({ type: "bed", staff: 3, beds1: 10, beds2: 5 }).result).toBe(23));
  test("온돌 숙박: 종사자 2 + 100÷3 = 35.3 → 35", () => expect(occupancy({ type: "nobed", staff: 2, area: 100, excl: 0 }).result).toBe(35));
  test("제외 면적이 더 크면 오류", () => expect(occupancy({ type: "etc", area: 10, excl: 20 }).ok).toBe(false));
});

describe("피난기구 — 노유자시설 3층 이상 해당 층 표시", () => {
  const fl = (n, a) => Array.from({ length: n }, (_, i) => ({ level: i + 1, area: a }));
  test("노유자 3층(2026) → 지상 2층부터 표시", () => {
    const r = evaluateAt({ use: "noyu", area: 900, gf: 3, bf: 0, floors: fl(3, 300), f: {} }, "2026-11-08");
    const row = r.byKey.escape;
    expect(row.status).toBe("설치");
    const bases = row.hits.map((h) => h.basis);
    expect(bases.every((b) => b.includes("지상 2~3층"))).toBe(true);
  });
  test("노유자 3층(2016, 1·2층 규정 전) → 지상 3층부터", () => {
    const r = evaluateAt({ use: "noyu", area: 900, gf: 3, bf: 0, floors: fl(3, 300), f: {} }, "2016-01-01");
    expect(r.byKey.escape.hits.map((h) => h.basis).join()).toContain("지상 3~3층");
  });
  test("지하층: 2022.9.8. NFSC 301 별표1 지하층 적응성 삭제 이후 → 지하 1층·지상 2층 업무시설은 비대상", () => {
    const r = evaluateAt({ use: "office", area: 900, gf: 2, bf: 1, floors: fl(2, 300), f: {} }, "2026-11-08");
    expect(r.byKey.escape.status).not.toBe("설치");
  });
  test("지하층: 허가일과 관계없이 표시하지 않음(2020 허가분도 비대상)", () => {
    const r = evaluateAt({ use: "office", area: 900, gf: 2, bf: 1, floors: fl(2, 300), f: {} }, "2020-05-01");
    expect(r.byKey.escape.status).not.toBe("설치");
    const r2 = evaluateAt({ use: "office", area: 1500, gf: 5, bf: 2, floors: fl(5, 300), f: {} }, "2000-05-01");
    expect(r2.byKey.escape.hits.map((h) => h.basis).join()).not.toContain("지하");
  });
  test("지하층 있는 5층 업무시설(2026) → 지상 3~5층만", () => {
    const r = evaluateAt({ use: "office", area: 1500, gf: 5, bf: 2, floors: fl(5, 300), f: {} }, "2026-11-08");
    const b = r.byKey.escape.hits.map((h) => h.basis).join();
    expect(b).toContain("지상 3~5층");
    expect(b).not.toContain("지하");
  });
  test("업무시설 5층 → 지상 3층부터(변경 없음)", () => {
    const r = evaluateAt({ use: "office", area: 1500, gf: 5, bf: 0, floors: fl(5, 300), f: {} }, "2026-11-08");
    expect(r.byKey.escape.hits.map((h) => h.basis).join()).toContain("지상 3~5층");
  });
});

describe("무창층 — 개구부 면적 직접 입력(v2.38.1)", () => {
  test("면적 칸만 입력해도 판정, 0·빈칸은 무시", () => {
    expect(windowlessFloor({ level: 2, area: 300, windows: [], areas: ["4", "6", "0", "", "0", "0", "0", "0"] }).status).toBe("무창층"); // 10 = 300/30
    const r = windowlessFloor({ level: 2, area: 300, windows: [], areas: ["4", "6.5", "0"] });
    expect(r.direct).toBe(10.5);
    expect(r.status).toBe("유창층");
  });
  test("치수 입력과 면적 입력을 함께 쓰면 합산", () => {
    const r = windowlessFloor({ level: 1, area: 600, doors: [{ w: 2, h: 2, cnt: 1 }], windows: [{ w: 2, h: 1, cnt: 3 }], areas: ["10.5", "0"] });
    expect(r.sum).toBe(20.5); // 4 + 6 + 10.5
    expect(r.status).toBe("유창층"); // 기준 20
  });
});

test("무창층 — 지하층은 판정 대상이 아니라 「지하층」으로 분류(v2.40.0)", () => {
  const r = windowlessFloor({ level: -1, area: 500, windows: [{ w: 2, h: 2, cnt: 1 }] });
  expect(r.status).toBe("지하층");
  expect(r.limit).toBeNull();
});

test("무창층 — 개구부를 하나도 입력하지 않은 층은 noInput(입력 화면 반영 제외)", () => {
  expect(windowlessFloor({ level: 3, area: 449.25, windows: [{ w: "", h: "", cnt: "1" }], areas: ["0", "0"] }).noInput).toBe(true);
  expect(windowlessFloor({ level: 3, area: 449.25, windows: [], areas: ["0", "2"] }).noInput).toBe(false);
});
