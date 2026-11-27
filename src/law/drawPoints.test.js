import { drawPoints } from "./drawPoints";
const mk = (groups, o = {}, facs = ["ext", "hydrant", "spk", "afd", "escape", "rescue", "guide", "elight", "plight"]) =>
  drawPoints({ g: (...k) => k.some((x) => groups.includes(x)), gf: 4, bf: 0, area: 3000, f: {}, has: (k) => facs.includes(k), ...o });
const of = (r, fac) => (r.find((d) => d.fac === fac) || { items: [] }).items;

test("병원 4층·지하 1층 — 기준개수 10개, 입원실 조기반응형, 개정 항목 맨 앞, 피난기구 구조대만, 대형 유도등", () => {
  const r = mk(["medical", "hosp"], { bf: 1 });
  const spk = of(r, "spk");
  expect(spk.map((x) => x.short)).toEqual(["헤드 기준개수 10개", "조기반응형 헤드(병원·의원 입원실)"]); // 지하주차장 습식·송수구·전기차는 표시 안 함
  expect(spk.find((x) => x.short.startsWith("헤드")).src).toBe("NFTC 103 표 2.1.1.1");
  expect(of(r, "afd")[0].src).toBe("NFTC 203 2.4.2.5");
  expect(of(r, "escape")[0].short).toBe("3~4층 구조대(완강기 불가)");
  expect(of(r, "guide")[0].short).toBe("대형피난구유도등·통로유도등");
  expect(of(r, "rescue").map((x) => x.short)).toEqual(["방열복·공기호흡기 각 2개"]); // 지하 포함 5층
  expect(of(r, "afd").some((x) => x.short === "우선경보방식")).toBe(false); // 해당 없으면 숨김
});

test("숙박시설(관광숙박업 외) 5층 — 침실 조기반응형, 중형 유도등, 완강기 추가, 휴대용비상조명등 실마다", () => {
  const r = mk(["lodging"], { gf: 5 });
  expect(of(r, "spk").some((x) => x.short === "조기반응형 헤드(숙박시설 침실)")).toBe(true);
  expect(of(r, "escape").map((x) => x.short)).toEqual(["객실마다 완강기·간이완강기"]);
  expect(of(r, "guide")[0].short).toBe("중형피난구유도등·통로유도등");
  expect(of(r, "plight")[0].short).toBe("객실·영업장 실마다 1개");
});

test("노유자 4층 이상은 구조대 대신 다른 기구, 업무시설 12층은 기준개수 30·우선경보·제어반 구분", () => {
  expect(of(mk(["noyu"], { gf: 5 }), "escape")[0].short).toMatch(/^1~3층 구조대\(완강기 불가\) \/ 4~5층 피난교·다수인피난장비·승강식/);
  const o = mk(["office"], { gf: 12, area: 15000 });
  expect(of(o, "spk").map((x) => x.short)).toContain("헤드 기준개수 30개");
  expect(of(o, "spk").map((x) => x.short)).toContain("감시·동력제어반 구분");
  expect(of(o, "afd").map((x) => x.short)).toContain("우선경보방식");
  expect(of(o, "guide")[0].text).toContain("11층 이상");
  expect(of(mk(["office"]), "guide")).toEqual([]); // 소형 대상은 표시 안 함
  expect(of(mk(["office"]), "escape")).toEqual([]); // 완강기 적응 대상은 표시 안 함
});

test("아파트(NFTC 608)·창고(609)는 일반 기준 대신 특례, 설치 대상 아닌 설비는 표시 안 함", () => {
  const a = mk(["apt"], { gf: 20 });
  expect(of(a, "spk").map((x) => x.src)).toEqual(["NFTC 103 2.5.15", "NFTC 608 2.3.1.1", "NFTC 608 2.3.1.6", "NFTC 103 2.7.5(4)", "NFTC 103 2.10.1"]);
  expect(of(a, "spk")[0].rev).toBe(true);
  expect(of(a, "guide").map((x) => x.src)).toEqual(["NFTC 608 2.10.1.1", "NFTC 608 2.10.1.3"]);
  expect(of(a, "afd").map((x) => x.short)).toContain("우선경보방식"); // 공동주택 16층 이상
  const w = mk(["warehouse"], { gf: 3, area: 5000 }, ["ext", "spk", "guide", "escape"]);
  expect(of(w, "spk").map((x) => x.short)).toEqual(["라지드롭형 습식"]);
  expect(of(w, "escape")).toEqual([]);
  expect(of(w, "guide")[0].src).toBe("NFTC 609 2.6.1");
  expect(of(w, "afd")).toEqual([]);
});

test("객석유도등 — 「유도등」 줄에 「객석유도등」으로 함께 표시(시행령 별표4 제3호다목2))", () => {
  const r = mk(["religion"], {}, ["guide", "seatguide"]);
  expect(of(r, "seatguide")).toEqual([]); // 따로 줄을 만들지 않고 「유도등」에 함께
  expect(of(r, "guide")).toEqual([expect.objectContaining({ short: "객석유도등", src: "소방시설법 시행령 별표4 제3호다목2)" })]);
  expect(of(r, "guide")[0].text).toContain("종교시설");
  const sp = mk(["sports"], {}, ["guide", "seatguide"]);
  expect(of(sp, "guide").map((x) => x.short)).toEqual(["대형피난구유도등·통로유도등", "객석유도등"]);
  expect(of(mk(["office"], {}, ["guide"]), "guide")).toEqual([]);
});
