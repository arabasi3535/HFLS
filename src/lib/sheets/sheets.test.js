import { buildingBook, readBuildingBook, parseLevel } from "./building";
import { EMPTY, syncFloors } from "../../components/Wizard";
import { readBook } from "../xlsx";
import { strFromU8, unzipSync } from "fflate";

describe("엑셀 서식 — 건축물", () => {
  test("빈 서식: 시트·목록·숨김 열", () => {
    const b = buildingBook("existing");
    const files = unzipSync(b);
    expect(Object.keys(files)).toContain("xl/worksheets/sheet3.xml"); // 입력·층별·목록
    const wb = strFromU8(files["xl/workbook.xml"]);
    expect(wb).toContain('name="목록" sheetId="3" state="hidden"');
    const s1 = strFromU8(files["xl/worksheets/sheet1.xml"]);
    expect(s1).toContain('hidden="1"');
    expect(s1).toContain("<dataValidation");
    const book = readBook(b);
    expect(book.map((x) => x.name)).toEqual(["입력", "층별", "목록"]);
  });
  test("채운 서식 → 다시 읽으면 같은 입력", () => {
    const inp0 = { ...EMPTY, action: "existing", date: "2015-03-02", grp: "15", use: "factory", gf: "3", bf: "1", area: "4500", occ: "", useArea: "", completed: "2016-01-10",
      f: { combustibleTimes: "600", nonFireproof: true, gasUse: true, parkingInside: "250", elecRoom: "320", height: "14", radwaste: "noWater" } };
    inp0.floors = syncFloors(inp0).map((f) => ({ ...f, area: "1125", windowless: f.level === 2 }));
    const { input, warn } = readBuildingBook(buildingBook("existing", inp0), "existing");
    expect(warn).toEqual([]);
    expect(input.use).toBe("factory");
    expect(input.grp).toBe("15");
    expect(input.date).toBe("2015-03-02");
    expect(input.completed).toBe("2016-01-10");
    expect([input.gf, input.bf, input.area]).toEqual(["3", "1", "4500"]);
    expect(input.f).toEqual(inp0.f);
    expect(input.floors).toEqual(inp0.floors);
  });
  test("층 표기 해석", () => {
    expect([parseLevel("지하 2"), parseLevel("B1"), parseLevel("3층"), parseLevel("10"), parseLevel("지상2층"), parseLevel("옥상")]).toEqual([-2, -1, 3, 10, 2, null]);
  });
});

describe("엑셀 서식 — 자체점검 보고서", () => {
  const { reportBook, readReportBook } = require("./report");
  const { emptyReport, rowItems, ROWS_L } = require("../../law/report");
  test("채운 서식 → 다시 읽기(관계인)", () => {
    const afd = ROWS_L.find((r) => r.id === "afd");
    const it = rowItems(afd)[0];
    const r0 = { ...emptyReport("owner"), name: "○○빌딩", useLabel: "근린생활시설", addr: "경상북도 안동시 ○○로 1", from: "2026-11-01", to: "2026-11-02", reportDate: "2026-11-03",
      owner: { kind: "관리자", name: "홍길동", tel: "010-1" }, grade: "3급", insurance: { on: true, company: "○○화재", from: "2026-01-01", to: "2026-12-31", person: "15", property: "10" },
      rows: { ext: { on: true, bad: {} }, afd: { on: true, bad: { [it.code]: { text: "수신기 표시 불량", qty: "1층 1개" } } } }, multi: { 노래연습장업: "1" } };
    r0.bld = { ...r0.bld, parking: ["지하", "옥외"], area: "800" };
    r0.inspectors = r0.inspectors.map((p, i) => ({ ...p, name: `점검${i}` }));
    const { rep, warn } = readReportBook(reportBook("owner", r0), "owner");
    expect(warn).toEqual([]);
    for (const k of ["name", "useLabel", "addr", "from", "to", "reportDate", "grade", "note"]) expect(rep[k]).toBe(r0[k]);
    expect(rep.owner).toEqual(r0.owner);
    expect(rep.insurance).toEqual(r0.insurance);
    expect(rep.bld.parking).toEqual(["지하", "옥외"]);
    expect(rep.rows).toEqual(r0.rows);
    expect(rep.multi).toEqual(r0.multi);
    expect(rep.inspectors.map((p) => p.name)).toEqual(["점검0", "점검1", "점검2"]);
  });
  test("「불량」만 적으면 기본 불량 문구, 불량 있으면 설치로", () => {
    const { readForms } = require("../sheetForm");
    const book = reportBook("comp");
    const f = readForms(book)[0];
    const k = Object.keys(f.values).find((x) => x.startsWith("rowbad.spk."));
    expect(k).toBeTruthy();
  });
});

describe("엑셀 서식 — 위험물 정기점검", () => {
  const { wmBook, readWmBook } = require("./wm");
  const { wmForm, results, emptyWm, emptyCard } = require("../../law/wm");
  test("주유취급소 채운 서식 → 다시 읽기(기본값과 다른 결과만 저장)", () => {
    const f = wmForm("gas");
    const st = { ...emptyWm(), opts: { self: "self", hang: "y" }, hdr: { from: "2026-03-01", to: "2026-03-04", biz: "○○주유소", permitNo: "제21-1호" }, hz: [{ item: "4-1n", amount: "50000" }, { item: "4-2n", amount: "100000" }], res: { 3: "부적합" }, note: { 3: "2026.3.10. 보수 예정" }, etc: "메모" };
    const { list, warn } = readWmBook(wmBook("gas", st));
    expect(warn).toEqual([]);
    expect(list).toHaveLength(1);
    const d = list[0].data;
    expect(list[0].sub).toBe("gas");
    expect(d.opts).toEqual(expect.objectContaining({ self: "self", hang: "y" }));
    expect(d.hdr).toEqual(st.hdr);
    expect(d.hz).toEqual(st.hz);
    expect(d.res).toEqual({ 3: "부적합" });
    expect(d.note).toEqual({ 3: "2026.3.10. 보수 예정" });
    expect(d.etc).toBe("메모");
    expect(results(f, d)).toEqual(results(f, st));
  });
  test("빈 서식은 기본 결과 그대로", () => {
    const { list } = readWmBook(wmBook("plant"));
    const f = wmForm("plant");
    expect(results(f, list[0].data)).toEqual(results(f, emptyWm()));
    expect(list[0].data.res).toEqual({});
  });
  test("위험물안전카드", () => {
    const c = { ...emptyCard(), name1: "휘발유", un: "1203", cls: { 4: true }, item: "제1석유류", feat: { flam: true }, state: { liquid: true }, aid: ["화기 차단", "", "", "", ""], owner: { name: "○○", addr: "안동", day: "054", night: "" } };
    const { list } = readWmBook(wmBook("card", c));
    expect(list[0].sub).toBe("card");
    expect(list[0].data).toEqual(c);
  });
});

describe("엑셀 서식 — 안전시설등 세부점검표", () => {
  const { muBook, readMuBook } = require("./mu");
  const { emptyMu, muResults } = require("../../law/mu");
  test("채운 서식 → 다시 읽기", () => {
    const s0 = { ...emptyMu(), type: "karaoke", opts: { floor: "under", rooms: true }, hdr: { ...emptyMu().hdr, name: "○○노래연습장", addr: "안동시", date: "2026-11-11", checker: "홍길동", qual: "다중이용업주" }, res: { 2: "불량" }, act: { 2: "감지기 교체 예정" } };
    const { data, warn } = readMuBook(muBook(s0));
    expect(warn).toEqual([]);
    expect(data.type).toBe("karaoke");
    expect(data.hdr).toEqual(s0.hdr);
    expect(data.res).toEqual({ 2: "불량" });
    expect(data.act).toEqual({ 2: "감지기 교체 예정" });
    expect(muResults(data)).toEqual(muResults(s0));
  });
  test("빈 서식 → 기본값", () => {
    const { data } = readMuBook(muBook());
    expect(data.res).toEqual({});
    expect(data.type).toBe("");
  });
});
