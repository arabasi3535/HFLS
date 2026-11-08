import { guideKind } from "../guide";
import { applySeed, emptyReport } from "../report";

const rv = (id, gf = 3, bf = 0, extra = {}) => ({ use: { id }, input: { gf, bf, floors: [], f: {}, ...extra } });

describe("유도등·유도표지 구분 — NFTC 303 표 2.1.1", () => {
  test("제1호 공연장 → 유도등(크기 표시 없음)", () => {
    const g = guideKind(rv("perf"));
    expect(g.kind).toBe("light");
    expect(g.no).toBe("제1호");
    expect(g.items).toEqual(["피난구유도등", "통로유도등"]);
  });
  test("제3호 판매시설·제4호 오피스텔 → 유도등", () => {
    expect(guideKind(rv("retail")).no).toBe("제3호");
    expect(guideKind(rv("officetel")).no).toBe("제4호");
  });
  test("제6호 근린생활시설(지상 3층) → 유도등", () => expect(guideKind(rv("neigh")).no).toBe("제6호"));
  test("제5호 근린생활시설 + 지하층 → 유도등", () => expect(guideKind(rv("neigh", 3, 1)).no).toBe("제5호"));
  test("제5호 무창층·11층 이상", () => {
    expect(guideKind(rv("parking", 2, 0, { floors: [{ level: 1, windowless: true }] })).no).toBe("제5호");
    expect(guideKind(rv("animal", 11)).no).toBe("제5호");
  });
  test("제7호 주차용 건축물(지상·유창) → 유도표지", () => {
    const g = guideKind(rv("parking", 3));
    expect(g.kind).toBe("sign");
    expect(g.items).toEqual(["피난구유도표지", "통로유도표지"]);
  });
  test("공동주택·창고시설 → 별도 기준 유도등", () => {
    expect(guideKind(rv("apt", 15)).kind).toBe("light");
    expect(guideKind(rv("warehouse", 1)).kind).toBe("light");
    expect(guideKind(rv("row", 4)).ref).toContain("NFTC 608");
    expect(guideKind(rv("logistics", 2)).ref).toContain("NFTC 609");
  });
  test("다중이용업소가 있으면 제6호", () => expect(guideKind(rv("tourist", 2, 0, { f: { multiUse: true } })).no).toBe("제6호"));
  test("보고서: 유도표지 대상이면 유도표지만 체크", () => {
    const r = applySeed(emptyReport(), { at: 1, facs: ["guide", "ext"], guideKind: "sign" });
    expect(r.rows.guide.on).toBe(false);
    expect(r.rows.sign.on).toBe(true);
    const l = applySeed(emptyReport(), { at: 1, facs: ["guide"], guideKind: "light" });
    expect(l.rows.guide.on).toBe(true);
    expect(l.rows.sign.on).toBe(false);
  });
});
