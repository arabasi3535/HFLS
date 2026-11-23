// 별표5 대체(면제) — 대체 설비가 실제로 설치되는 경우에만 면제(v2.38.1)
import { review, STATUS } from "./engine";
import { substitutionsFor, defaultInstalled, resolveSubs, subDefaultOn } from "./installed";

const floors = (list) => list.map(([level, area]) => ({ level, area, windowless: false }));
const rv = (o) => review({ action: "new", date: "2026-11-23", bf: 0, ...o }, "2026-11-23");
const ids = (r) => substitutionsFor(r.hist.rows, r.use).map((s) => s.id);

test("스프링클러설비가 설치 대상이 아니면 물분무등 ← 스프링클러(제5호) 대체 후보가 아님 — 종교시설 3층 1,474.82㎡, 내부 주차장 981㎡", () => {
  const r = rv({ use: "religion", gf: 3, area: 1474.82, floors: floors([[1, 259.72], [2, 765.85], [3, 449.25]]), f: { parkingInside: 981 } });
  expect(r.hist.byKey.water.status).toBe(STATUS.REQ);
  expect(r.hist.byKey.spk.status).not.toBe(STATUS.REQ);
  expect(ids(r)).not.toContain("s5");
  const d = defaultInstalled(r, false);
  expect(d.buildKeys).toContain("water");
  expect(d.buildKeys).not.toContain("spk");
});

test("스프링클러설비가 설치 대상이면 제5호 대체 후보·기본 적용", () => {
  const r = rv({ use: "office", gf: 7, area: 4200, floors: floors([1, 2, 3, 4, 5, 6, 7].map((l) => [l, 600])), f: { parkingInside: 300 } });
  expect(r.hist.byKey.spk.status).toBe(STATUS.REQ);
  expect(ids(r)).toContain("s5");
  const d = defaultInstalled(r, false);
  expect(d.list.find((i) => i.key === "water").sub.id).toBe("s5");
});

test("대체 설비가 다른 대체로 빠지면 그 설비로는 대체 불가(연쇄 확인)", () => {
  const items = new Map([["spk", { kind: "base" }], ["water", { kind: "base" }], ["afd", { kind: "base" }]]);
  const subs = [
    { id: "s5", target: "water", viaKeys: ["spk"] },
    { id: "s9", target: "afd", viaKeys: ["water"] },
  ];
  const r = resolveSubs(subs, () => true, items);
  expect(r.applied.map((s) => s.id)).toEqual(["s5"]);
  expect(r.blocked.get("s9")).toMatch(/물분무등소화설비/);
  // 대체 설비가 둘이면 남은 것으로 적용
  const r2 = resolveSubs([subs[0], { id: "s9", target: "afd", viaKeys: ["spk", "water"] }], () => true, items);
  expect(r2.applied.find((s) => s.id === "s9").viaKeys).toEqual(["spk"]);
});

test("서로 대체(자탐 ← 화재알림, 화재알림 ← 자탐)는 먼저 것만 적용", () => {
  const items = new Map([["afd", { kind: "base" }], ["notify", { kind: "base" }]]);
  const r = resolveSubs([{ id: "s9", target: "afd", viaKeys: ["notify"] }, { id: "s10", target: "notify", viaKeys: ["afd"] }], () => true, items);
  expect(r.applied.map((s) => s.id)).toEqual(["s9"]);
  expect(r.blocked.has("s10")).toBe(true);
});

test("간이스프링클러·연결살수 ← 물분무등뿐이면(제4·19호) 기본 해제 — 물분무·미분무만 인정", () => {
  const s = { id: "s4", weakOnly: true };
  expect(subDefaultOn(s)).toBe(false);
  expect(subDefaultOn({ id: "s4", weakOnly: false })).toBe(true);
  // 근린생활시설 1,000㎡ 이상(간이스프링클러) + 내부 주차장 300㎡(물분무등), 스프링클러 비대상
  const r = rv({ use: "neigh", gf: 2, area: 1200, floors: floors([[1, 600], [2, 600]]), f: { parkingInside: 300 } });
  expect(r.hist.byKey.sspk.status).toBe(STATUS.REQ);
  expect(r.hist.byKey.spk.status).not.toBe(STATUS.REQ);
  const s4 = substitutionsFor(r.hist.rows, r.use).find((x) => x.id === "s4");
  expect(s4.weakOnly).toBe(true);
  expect(defaultInstalled(r, false).buildKeys).toContain("sspk");
});
