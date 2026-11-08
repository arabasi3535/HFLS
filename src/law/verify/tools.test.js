// 보조 계산기(무창층·수용인원) 테스트
import { windowlessFloor, openingRow, occupancy } from "../tools";

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

import { evaluateAt } from "../engine";
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
  test("업무시설 5층 → 지상 3층부터(변경 없음)", () => {
    const r = evaluateAt({ use: "office", area: 1500, gf: 5, bf: 0, floors: fl(5, 300), f: {} }, "2026-11-08");
    expect(r.byKey.escape.hits.map((h) => h.basis).join()).toContain("지상 3~5층");
  });
});
