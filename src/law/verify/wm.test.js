import { WM_FORMS, wmForm, wmRows, results, emptyWm, headLine } from "../wm";

describe("위험물 정기점검표 — 세부기준 별지 제9~24호", () => {
  test("탭 순서: 주유·이동탱크·일반취급소·지하탱크 → 별지 순번, 소방시설 별도", () => {
    expect(WM_FORMS.filter((f) => f.kind === "facility").map((f) => f.tab)).toEqual(["주유취급소", "이동탱크저장소", "일반취급소", "지하탱크저장소", "제조소", "옥내저장소", "옥외탱크저장소", "옥외저장소", "암반탱크저장소", "이송취급소"]);
    expect(WM_FORMS.filter((f) => f.kind === "fire").map((f) => f.form)).toEqual(["18", "19", "20", "21", "22", "23", "24"]);
  });
  test("서식 항목 수(원본 점검결과 칸 수와 일치)", () => {
    const n = (id) => wmRows(wmForm(id)).length;
    expect(n("plant")).toBe(169);
    expect(n("instore")).toBe(34);
    expect(n("outtank")).toBe(123);
    expect(n("ugtank")).toBe(74);
    expect(n("mobile")).toBe(38);
    expect(n("gas")).toBe(88);
    expect(n("afd")).toBe(18);
  });
  test("주유취급소: 일반이면 셀프용·감시대 해당없음, 셀프면 적합", () => {
    const f = wmForm("gas");
    const rows = wmRows(f);
    const selfIdx = rows.map((r, i) => (r[4] === "self" ? i : -1)).filter((i) => i >= 0);
    expect(selfIdx.length).toBe(16); // 셀프용 노즐 수동폐쇄장치는 교재 예시대로 기본 해당없음(ex)
    const g = results(f, emptyWm());
    expect(selfIdx.every((i) => g[i] === "해당없음")).toBe(true);
    const s = results(f, { ...emptyWm(), opts: { self: "self" } });
    expect(selfIdx.every((i) => s[i] === "적합")).toBe(true);
    expect(g.filter((x) => x === "적합").length).toBe(88 - 16 - 3 - 5); // 현수식 3, 교재 예시 해당없음 5
  });
  test("직접 고친 결과가 기본값보다 우선", () => {
    const f = wmForm("gas");
    const r = results(f, { ...emptyWm(), res: { 0: "부적합" } });
    expect(r[0]).toBe("부적합");
  });
  test("이동탱크: 상치장소·컨테이너식·보냉", () => {
    const f = wmForm("mobile");
    const rows = wmRows(f);
    const r = results(f, emptyWm());
    const at = (cond) => rows.map((x, i) => (x[4] === cond ? r[i] : null)).filter(Boolean);
    expect(at("parkOut")).toEqual(["적합"]);
    expect(at("parkIn")).toEqual(["해당없음"]);
    expect(at("container")).toEqual(["해당없음", "해당없음", "해당없음"]);
  });
  test("옥외탱크: 부상지붕식만 부상지붕 항목 적합", () => {
    const f = wmForm("outtank");
    const rows = wmRows(f);
    const fl = rows.map((x, i) => (x[4] === "float" ? i : -1)).filter((i) => i >= 0);
    expect(fl.length).toBe(4);
    expect(fl.every((i) => results(f, emptyWm())[i] === "해당없음")).toBe(true);
    expect(fl.every((i) => results(f, { ...emptyWm(), opts: { roof: "float" } })[i] === "적합")).toBe(true);
  });
  test("별지 제19호 스프링클러·물분무 — 100항목, 구분 표기·제목", () => {
    const { titleOf } = require("../wm");
    const f = wmForm("spr");
    expect(wmRows(f).length).toBe(100);
    expect(headLine(f, { opts: { kind: "spray" } })).toBe("[√] 물분무소화설비  [  ] 스프링클러설비");
    expect(titleOf(f, emptyWm())).toBe("스프링클러설비 일반점검표");
    expect(titleOf(f, { ...emptyWm(), opts: { kind: "spray" } })).toBe("물분무소화설비 일반점검표");
  });
  test("소화설비 가압송수장치·예비동력원 선택", () => {
    const f = wmForm("hyd");
    const rows = wmRows(f);
    const at = (st, cond) => { const r = results(f, st); return [...new Set(rows.map((x, i) => (x[4] === cond ? r[i] : null)).filter(Boolean))]; };
    expect(at(emptyWm(), "motor")).toEqual(["적합"]);
    expect(at(emptyWm(), "engine")).toEqual(["해당없음"]);
    expect(at({ ...emptyWm(), opts: { pump: "engine" } }, "motor")).toEqual(["해당없음"]);
    expect(at({ ...emptyWm(), opts: { pump: "engine" } }, "engine")).toEqual(["적합"]);
    expect(at(emptyWm(), "gen")).toEqual(["적합"]);
    expect(at(emptyWm(), "bat")).toEqual(["해당없음"]);
    expect(at({ ...emptyWm(), opts: { power: "bat" } }, "gen")).toEqual(["해당없음"]);
    expect(rows.filter((x) => x[4] === "engine").length).toBe(23);
  });
  test("제조소·일반취급소: 설비 유무 선택, 교재 예시 해당없음", () => {
    const f = wmForm("plant");
    const rows = wmRows(f);
    const cnt = (c) => rows.filter((x) => x[4] === c).length;
    expect([cnt("spill"), cnt("heat"), cnt("htank"), cnt("ex")]).toEqual([12, 28, 40, 12]);
    const r = results(f, emptyWm());
    expect(r.filter((x) => x === "해당없음").length).toBe(92);
    const y = results(f, { ...emptyWm(), opts: { spill: "y", heat: "y", htank: "y" } });
    expect(y.filter((x) => x === "해당없음").length).toBe(12);
  });
  test("옥내저장소: 다른용도 부분과 구획은 복합만", () => {
    const f = wmForm("instore");
    expect(results(f, emptyWm())[8]).toBe("해당없음");
    expect(results(f, { ...emptyWm(), opts: { floor: "mixed" } })[8]).toBe("적합");
  });
  test("옥외탱크: 교재 예시 해당없음 24항목", () => {
    const f = wmForm("outtank");
    expect(wmRows(f).filter((x) => x[4] === "ex").length).toBe(24);
    expect(results(f, emptyWm()).filter((x) => x === "해당없음").length).toBe(28);
  });
  test("머리 표기", () => {
    expect(headLine(wmForm("gas"), { opts: { self: "self", indoor: "in" } })).toContain("[√]옥내");
    expect(headLine(wmForm("handle"), {})).toContain("[√]일반취급소");
  });
});

describe("정기점검 결과 제출기한(법 제18조②)", () => {
  const { submitDue } = require("../wm");
  test("점검일 + 30일(초일 불산입)", () => {
    expect(submitDue("2026-11-10")).toEqual({ due: "2026-12-10", dow: "목", next: null, nextDow: null });
    expect(submitDue("2026-01-31").due).toBe("2026-03-02");
  });
  test("말일이 토·일요일이면 다음 월요일", () => {
    const r = submitDue("2026-11-14"); // 12-14 월
    expect(r.next).toBe(null);
    const s = submitDue("2026-11-12"); // 12-12 토
    expect(s).toMatchObject({ due: "2026-12-12", dow: "토", next: "2026-12-14" });
  });
  test("날짜 없으면 null", () => expect(submitDue("")).toBe(null));
});
