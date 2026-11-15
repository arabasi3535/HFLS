import { review } from "../engine";
import { siteManager, T } from "../temporary";
import { getLawSystem } from "../sources";

const sm = (o) => siteManager(review({ action: "new", f: {}, date: "2026-11-15", ...o }, "2026-11-15"));

describe("건설현장 소방안전관리자 — 화재예방법 시행령 제29조", () => {
  test("연면적 15,000㎡ 사무소: 제1호 대상", () => {
    const r = sm({ use: "office", area: 15000, gf: 5, bf: 1 });
    expect(r.status).toBe(T.YES);
    expect(r.why[0]).toContain("제29조제1호");
  });
  test("연면적 14,999㎡ 지상 10층 지하 1층: 비대상", () => {
    expect(sm({ use: "office", area: 14999, gf: 10, bf: 1 }).status).toBe(T.NO);
  });
  test("연면적 5,000㎡ 지하 2층: 제2호가목 대상", () => {
    expect(sm({ use: "office", area: 5000, gf: 3, bf: 2 }).status).toBe(T.YES);
  });
  test("연면적 6,000㎡ 지상 11층: 제2호나목 대상", () => {
    expect(sm({ use: "apt", area: 6000, gf: 11, bf: 0 }).status).toBe(T.YES);
  });
  test("연면적 4,999㎡ 지상 15층 지하 3층: 비대상(5천㎡ 미만)", () => {
    expect(sm({ use: "office", area: 4999, gf: 15, bf: 3 }).status).toBe(T.NO);
  });
  test("연면적 8,000㎡ 창고 지상 2층: 냉동·냉장창고 여부 확인 필요", () => {
    expect(sm({ use: "warehouse", area: 8000, gf: 2, bf: 0 }).status).toBe(T.CHK);
  });
});

describe("법령 체계 — 2012~2016 명칭", () => {
  test("2013년은 소방시설 설치·유지 및 안전관리에 관한 법률 체계", () => {
    expect(getLawSystem("2013-05-01").act).toBe("소방시설 설치·유지 및 안전관리에 관한 법률");
  });
  test("2016.1.21.부터 화재예방, 소방시설 설치ㆍ유지 및 안전관리에 관한 법률 체계", () => {
    expect(getLawSystem("2016-01-20").id).toBe("maint12");
    expect(getLawSystem("2016-01-21").id).toBe("prev");
  });
});
