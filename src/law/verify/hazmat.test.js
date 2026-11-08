import { HZ_SUBS, hzItem, hzSearch, hzRow, hzTotal, class4ByFlash, casValid } from "../hazmat";

describe("위험물 지정수량 — 별표1", () => {
  test("모든 물질의 품명이 존재하고 CAS 검사숫자가 맞음", () => {
    for (const s of HZ_SUBS) {
      expect(hzItem(s.item)).toBeTruthy();
      if (s.cas) expect(casValid(s.cas)).toBe(true);
    }
  });
  test("지정수량 값", () => {
    expect(hzItem("4-1n").q).toBe(200);
    expect(hzItem("4-2n").q).toBe(1000);
    expect(hzItem("4-3n").q).toBe(2000);
    expect(hzItem("4-veg").q).toBe(10000);
    expect(hzItem("3-5").q).toBe(20);
    expect(hzItem("1-8").q).toBe(1000);
    expect(hzItem("6-2").q).toBe(300);
  });
  test("CAS·이름 검색", () => {
    expect(hzSearch("67-64-1")[0].s.name).toBe("아세톤");
    expect(hzSearch("67641")[0].s.name).toBe("아세톤");
    expect(hzSearch("경유")[0].s.item).toBe("4-2n");
    expect(hzSearch("휘발유")[0].s.item).toBe("4-1n");
    expect(hzSearch("74-98-6")[0].type).toBe("not");
    expect(casValid("67-64-2")).toBe(false);
  });
  test("배수: 휘발유 400L + 경유 1,000L = 3배", () => {
    const t = hzTotal([
      { item: "4-1n", amount: "400" },
      { item: "4-2n", amount: "1000" },
    ]);
    expect(t.sum).toBe(3);
    expect(t.level).toBe("over");
  });
  test("소량위험물 구간·조건 미충족 제외", () => {
    expect(hzTotal([{ item: "4-2n", amount: "300" }]).level).toBe("small");
    expect(hzTotal([{ item: "4-2n", amount: "100" }]).level).toBe("under");
    expect(hzTotal([{ item: "6-2", amount: "500", off: true }]).sum).toBe(0);
  });
  test("단위 환산: 질산 200L × 비중 1.5 = 300kg → 1배", () => {
    const r = hzRow({ item: "6-3", amount: "200", unit: "L", sg: "1.5" });
    expect(r.ratio).toBeCloseTo(1);
    expect(hzRow({ item: "6-3", amount: "200", unit: "L" }).ok).toBe(false);
  });
  test("제5류는 종 선택 필요", () => {
    expect(hzRow({ item: "5-1", amount: "10" }).ok).toBe(false);
    expect(hzRow({ item: "5-1", amount: "10", q: "10" }).ratio).toBe(1);
  });
  test("인화점 판정", () => {
    expect(class4ByFlash({ flash: "-43" }).item).toBe("4-1n");
    expect(class4ByFlash({ flash: "-20", boil: "35" }).item).toBe("4-sp");
    expect(class4ByFlash({ flash: "50", ignite: "90" }).item).toBe("4-sp");
    expect(class4ByFlash({ flash: "21", water: true }).item).toBe("4-2w");
    expect(class4ByFlash({ flash: "70" }).item).toBe("4-3n");
    expect(class4ByFlash({ flash: "200" }).item).toBe("4-4");
    expect(class4ByFlash({ flash: "250" }).item).toBe(null);
  });
});
