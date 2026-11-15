import { lawChanges, LAW_BASE, lawKey } from "../lawBase";

describe("법령 개정 감시 — 기준선 비교", () => {
  test("기준선과 같은 시행일은 알림 없음", () => {
    const items = [{ n: "소방시설 설치 및 관리에 관한 법률 시행령", eff: LAW_BASE[lawKey("소방시설 설치 및 관리에 관한 법률 시행령")] }];
    expect(lawChanges(items)).toHaveLength(0);
  });
  test("시행일이 늦어지면 개정, 기준선에 없으면 새 기준 — 공백 차이는 같은 법령", () => {
    const items = [
      { n: "스프링클러설비의 화재안전기술기준(NFTC 103)", eff: "2027-01-01" },
      { n: "고층건축물의 화재안전성능기준(NFPC 604)", eff: "2022-12-01" }, // 기준선 이름은 「… (NFPC 604)」(공백 포함)
      { n: "배터리시설의 화재안전기술기준(NFTC 610)", eff: "2027-03-01" },
    ];
    const r = lawChanges(items);
    expect(r.map((x) => x.kind)).toEqual(["new", "amend"]);
    expect(r[1].base).toBe("2026-07-01");
  });
  test("기준선은 법령 18건 + NFPC·NFTC 82건", () => expect(Object.keys(LAW_BASE)).toHaveLength(100));
});
