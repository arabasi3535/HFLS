import { floorsFromLink, linkedPart, resetPart } from "./Tools";

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

test("수용인원 계산기 — 입력 화면에서 새로 열 때마다 입력을 모두 비움, 같은 at이면 유지(v2.44.0)", () => {
  const prev = { type: "hall", area: "500", excl: "20", link: { mode: "new", at: 1 } };
  expect(linkedPart(prev, { kind: "occ", mode: "new", at: 1 })).toBe(prev);
  expect(linkedPart(prev, { kind: "occ", mode: "existing", at: 2 })).toEqual({ link: { mode: "existing", at: 2 } });
  expect(linkedPart({}, { kind: "occ", mode: "new", at: 3 })).toEqual({ link: { mode: "new", at: 3 } });
});

test("무창층 계산기 — 새로 열면 층·바닥면적만, 같은 at이면 유지", () => {
  const link = { kind: "windowless", mode: "new", at: 5, floors: [{ level: 1, area: "100" }, { level: 2, area: "90" }] };
  const a = linkedPart({}, link);
  expect(a.floors.map((f) => [f.level, f.area])).toEqual([[1, "100"], [2, "90"]]);
  expect(a.link).toEqual({ mode: "new", at: 5, floors: [{ level: 1, area: "100" }, { level: 2, area: "90" }] });
  expect(linkedPart(a, link)).toBe(a);
});

test("「초기화」 — 층·바닥면적·산정 구분과 「입력에서 열었습니다」 연결까지 모두 지우고, 같은 입력에서 다시 채워지지 않음(v2.49.0)", () => {
  const wl = linkedPart({}, { kind: "windowless", mode: "existing", at: 7, floors: [{ level: -1, area: "50" }, { level: 3, area: "200" }] });
  const r = resetPart("windowless", wl);
  expect(r.floors.map((f) => [f.level, f.area])).toEqual([[1, ""]]);
  expect(r.link).toBeUndefined();
  expect(r.seenAt).toBe(7);
  expect(linkedPart(r, { kind: "windowless", mode: "existing", at: 7, floors: [{ level: 3, area: "200" }] })).toBe(r);
  const again = linkedPart(r, { kind: "windowless", mode: "existing", at: 8, floors: [{ level: 3, area: "200" }] }); // 새로 보내면 다시 채움
  expect(again.floors.map((f) => f.area)).toEqual(["200"]);
  expect(resetPart("windowless", r).seenAt).toBe(7);
  expect(resetPart("windowless", { floors: [] })).toEqual({ floors: [expect.objectContaining({ level: 1 })] });
  expect(resetPart("occ", { type: "hall", area: "300", link: { mode: "new", at: 9 } })).toEqual({ seenAt: 9 });
  expect(resetPart("occ", { type: "hall", area: "300" })).toEqual({});
});
