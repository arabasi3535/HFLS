import { MU_ITEMS, MU_TYPES, muResults, emptyMu } from "../mu";

describe("안전시설등 세부점검표 — 시행규칙 별지 제10호서식", () => {
  test("서식 15항목, 업종 26종(시행령 제2조 20 + 시행규칙 제2조 6)", () => {
    expect(MU_ITEMS).toHaveLength(15);
    expect(MU_TYPES).toHaveLength(26);
  });
  test("기본은 모두 빈칸(미선택)", () => {
    expect(muResults(emptyMu())).toEqual(Array(15).fill(""));
  });
  test("직접 고른 결과만", () => {
    expect(muResults({ ...emptyMu(), res: { 0: "불량", 1: "해당없음" } }).slice(0, 3)).toEqual(["불량", "해당없음", ""]);
  });
});
