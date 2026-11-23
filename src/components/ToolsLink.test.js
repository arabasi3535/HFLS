import { floorsFromLink } from "./Tools";

test("입력 화면 층·바닥면적을 무창층 계산기로 가져옴 — 지하층 포함, 같은 화면에서 다시 보내면 개구부 입력 유지", () => {
  const link = { mode: "new", floors: [{ level: -1, area: "300" }, { level: 1, area: "259.72" }, { level: 2, area: "765.85" }] };
  const a = floorsFromLink(link, {});
  expect(a.map((f) => [f.level, f.area])).toEqual([[-1, "300"], [1, "259.72"], [2, "765.85"]]);
  expect(a[1].areas).toHaveLength(8);
  const prev = { link: { mode: "new" }, floors: [{ ...a[1], areas: ["5", "0", "0", "0", "0", "0", "0", "0"] }] };
  const b = floorsFromLink({ ...link, floors: [{ level: 1, area: "260" }] }, prev);
  expect(b[0].areas[0]).toBe("5");
  expect(b[0].area).toBe("260");
  // 다른 화면(기존 건축물)에서 보내면 새로 시작
  expect(floorsFromLink({ ...link, mode: "existing", floors: [{ level: 1, area: "260" }] }, prev)[0].areas[0]).toBe("0");
});
