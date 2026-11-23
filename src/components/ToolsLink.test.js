import { floorsFromLink } from "./Tools";

test("입력 화면 층·바닥면적을 무창층 계산기로 가져옴 — 지하층 포함, 새로 보낼 때마다 개구부 입력은 비움", () => {
  const link = { mode: "new", floors: [{ level: -1, area: "300" }, { level: 1, area: "259.72" }, { level: 2, area: "765.85" }] };
  const a = floorsFromLink(link);
  expect(a.map((f) => [f.level, f.area])).toEqual([[-1, "300"], [1, "259.72"], [2, "765.85"]]);
  expect(a[1].areas).toHaveLength(8);
  expect(a[1].areas.every((x) => x === "0")).toBe(true);
  expect(a[1].doors).toHaveLength(1);
  expect(a[1].doors[0].w).toBe("");
  expect(a[2].doors).toHaveLength(0);
  // 같은 화면에서 다시 보내도(다음 대상) 이전 개구부 입력은 남지 않음
  const b = floorsFromLink({ ...link, floors: [{ level: 1, area: "260" }] });
  expect(b).toHaveLength(1);
  expect(b[0].area).toBe("260");
  expect(b[0].areas[0]).toBe("0");
  expect(b[0].windows[0].w).toBe("");
  // 층 정보가 없으면 지상 1층 빈 칸
  expect(floorsFromLink({ mode: "new", floors: [] }).map((f) => f.level)).toEqual([1]);
});
