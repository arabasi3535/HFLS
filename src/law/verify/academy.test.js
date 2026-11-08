import { judgeAll } from "../academy";

const A = (name, area, sep = false) => ({ kind: "academy", name, area: String(area), excl: "", sep });
const O = (name, kind = "other", sep = false) => ({ kind, name, area: "", sep });
const pick = (res, name) => res.find((r) => r.name === name);

describe("학원 다중이용업소 — 시행령 제2조제3호·업무연찬 예시", () => {
  const ex1 = (fire) => [
    { name: "3층", fireFloor: fire, units: [A("A학원", 198), A("B학원", 120), A("C학원", 175)] },
    { name: "2층", fireFloor: fire, units: [A("D학원", 250), A("E학원", 243)] },
    { name: "1층", fireFloor: fire, units: [O("소매점"), O("사무실"), O("서점")] },
  ];
  test("예시1 층별 방화구획 — 3층 합산 493㎡(259명) → A학원 해당 없음", () => {
    const a = pick(judgeAll(ex1(true)), "A학원");
    expect(a.n).toBe(104);
    expect(a.status).toBe("비대상");
    expect(a.steps.join(" ")).toContain("493㎡");
  });
  test("예시1 방화구획 없음 — 전체 학원 986㎡(519명) → A학원 다중이용업소(나목(2))", () => {
    const a = pick(judgeAll(ex1(false)), "A학원");
    expect(a.status).toBe("대상");
    expect(a.basis).toBe("제3호나목(2)");
  });
  const ex2 = (fire) => [
    { name: "3층", fireFloor: fire, units: [A("A학원", 230), A("B학원", 210)] },
    { name: "2층", fireFloor: fire, units: [O("C목욕탕", "multi")] },
    { name: "1층", fireFloor: fire, units: [O("소매점"), O("약국")] },
  ];
  test("예시2 층별 방화구획 — 3층 440㎡ → B학원 해당 없음", () => expect(pick(judgeAll(ex2(true)), "B학원").status).toBe("비대상"));
  test("예시2 방화구획 없음 — B학원 111명 + 목욕탕 → 다중이용업소(나목(3))", () => {
    const b = pick(judgeAll(ex2(false)), "B학원");
    expect(b.n).toBe(111);
    expect(b.status).toBe("대상");
    expect(b.basis).toBe("제3호나목(3)");
  });
  test("예시3 영업장별 방화구획 — 신규학원 220㎡ 단독 → 해당 없음", () => {
    const fl = [{ name: "1층", fireFloor: false, units: [A("기존학원", 130, true), A("신규학원", 220, true), O("일반음식점", "multi", true)] }];
    expect(pick(judgeAll(fl), "신규학원").status).toBe("비대상");
  });
  test("가목 300명 이상은 방화구획과 관계없이 해당", () => {
    const fl = [{ name: "2층", fireFloor: true, units: [A("큰학원", 600, true)] }];
    const r = pick(judgeAll(fl), "큰학원");
    expect(r.n).toBe(316);
    expect(r.basis).toBe("제3호가목");
  });
  test("기숙사 동일 범위 → 나목(1), 100명 미만은 해당 없음", () => {
    const fl = [{ name: "1층", fireFloor: false, units: [A("학원", 200), O("기숙사", "dorm"), A("작은학원", 150)] }];
    const res = judgeAll(fl);
    expect(pick(res, "학원").basis).toContain("(1)");
    expect(pick(res, "작은학원").status).toBe("비대상");
  });
});
