import { MU_ITEMS, MU_TYPES, muApplies, muResults, emptyMu } from "../mu";

const st = (type, opts = {}) => ({ ...emptyMu(), type, opts });
const na = (s) => muResults(s).map((r, i) => (r === "해당없음" ? i + 1 : null)).filter(Boolean);

describe("안전시설등 세부점검표 — 시행규칙 별지 제10호서식", () => {
  test("서식 15항목, 업종 26종(시행령 제2조 20 + 시행규칙 제2조 6)", () => {
    expect(MU_ITEMS).toHaveLength(15);
    expect(MU_TYPES).toHaveLength(26);
  });
  test("일반음식점 지상 2층: 간이SP·피난통로·창문·영상음향·영상물 해당없음", () => {
    expect(na(st("rest"))).toEqual([2, 6, 7, 8, 11]);
  });
  test("일반음식점 지하층 → 간이SP 대상", () => {
    expect(muApplies(1, st("rest", { floor: "under" })).on).toBe(true);
  });
  test("노래연습장 지상: 간이SP·창문만 해당없음, 영상물 상영 대상", () => {
    expect(na(st("karaoke"))).toEqual([2, 7]);
  });
  test("고시원업: 지상 1층이면 간이SP 제외, 2층 이상이면 대상, 창문 대상", () => {
    expect(muApplies(1, st("gosiwon", { floor: "ground" })).on).toBe(false);
    expect(muApplies(1, st("gosiwon", { floor: "upper" })).on).toBe(true);
    expect(muApplies(6, st("gosiwon")).on).toBe(true);
  });
  test("권총사격장·밀폐구조 → 간이SP", () => {
    expect(muApplies(1, st("gun")).on).toBe(true);
    expect(muApplies(1, st("pc", { sealed: true })).on).toBe(true);
  });
  test("단란주점: 상영 시설 있을 때만 피난안내영상물", () => {
    expect(muApplies(10, st("danran")).on).toBe(false);
    expect(muApplies(10, st("danran", { filmFac: true })).on).toBe(true);
    expect(muApplies(10, st("pc", { filmFac: true })).on).toBe(false);
  });
  test("비상구·피난안내도 제외 선택", () => {
    expect(na(st("rest", { exitFree: true, mapFree: true }))).toEqual([2, 5, 6, 7, 8, 10, 11]);
  });
  test("직접 고친 결과 우선", () => {
    expect(muResults({ ...st("rest"), res: { 0: "불량", 1: "양호" } }).slice(0, 2)).toEqual(["불량", "양호"]);
  });
});
