// 업무자료 대조 점검(2026.11.23.) 반영 — A·B·C 항목 회귀 테스트
import { evaluateAt, review, STATUS } from "../engine";
import { substitutionsFor, resolveSubs, inspInstalled } from "../installed";
import { construction } from "../construction";
import { siteManager, T as TT } from "../temporary";
import { practiceNotes } from "../practiceNotes";

const fl = (gf, bf, area) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: false });
  return list;
};
const st = (r, k) => r.byKey[k].status;
const bld = (use, f = {}, o = {}) => ({ action: "new", use, area: 4000, gf: 2, bf: 0, floors: fl(2, 0, 2000), f, ...o });
const F = (...k) => Object.fromEntries(k.map((x) => [x, true]));

describe("A — 판정 오류 수정", () => {
  test("A1 노유자 스프링클러 600㎡: 2013.2.10.부터 해당 용도 바닥면적 합계", () => {
    // 연면적 800㎡ 중 노유자 용도 500㎡
    const b = bld("noyu", {}, { area: 800, useArea: 500, gf: 2, floors: fl(2, 0, 400) });
    expect(st(evaluateAt(b, "2013-02-09"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2013-02-10"), "spk")).toBe(STATUS.NONE);
  });
  test("A2 2004.5.30.~2008.8.15. 노유자시설 스프링클러 — 확정 「설치」", () => {
    const b = bld("noyu", {}, { area: 700, gf: 1, floors: fl(1, 0, 700) });
    expect(st(evaluateAt(b, "2004-06-01"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2008-08-15"), "spk")).toBe(STATUS.REQ);
  });
  test("A3 자동차정비공장 상시 보관 200㎡ 물분무등 — 1994.7.20.~2004.5.29.", () => {
    const b = bld("aircar", { carStoreArea: 250 });
    expect(st(evaluateAt(b, "1994-07-19"), "water")).toBe(STATUS.NONE);
    expect(st(evaluateAt(b, "1994-07-20"), "water")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2004-05-29"), "water")).toBe(STATUS.REQ);
    expect(st(evaluateAt(b, "2004-05-30"), "water")).toBe(STATUS.NONE);
  });
  test("A4·B4 아파트 부설 차고 물분무등 — 1992.7.28.부터 의무관리대상만(공동주택관리령 제7조)", () => {
    const apt = (f) => bld("apt", { parkingInside: 500, ...f }, { gf: 5, floors: fl(5, 0, 800) });
    expect(st(evaluateAt(apt({ households: 100, aptElevator: "no", aptCentralHeat: "no" }), "1993-01-01"), "water")).toBe(STATUS.NONE);
    expect(st(evaluateAt(apt({ households: 100, aptElevator: "yes" }), "1993-01-01"), "water")).toBe(STATUS.REQ);
    // 1999.7.1.부터 150세대 미만은 승강기가 있어도 의무관리대상 아님
    expect(st(evaluateAt(apt({ households: 100, aptElevator: "yes" }), "1999-07-01"), "water")).toBe(STATUS.NONE);
    expect(st(evaluateAt(apt({ households: 200, aptElevator: "yes" }), "1999-07-01"), "water")).toBe(STATUS.REQ);
    expect(st(evaluateAt(apt({ households: 350 }), "1999-07-01"), "water")).toBe(STATUS.REQ);
  });
  test("B4 아파트 자동화재탐지설비(1994.7.20.~2001.5.20.) — 1999.7.1.부터 150세대 미만 비대상", () => {
    const a = (hh, f = {}) => bld("apt", { households: hh, ...f }, { area: 1100, gf: 10, floors: fl(10, 0, 110) });
    expect(st(evaluateAt(a(19), "2001-03-13"), "afd")).toBe(STATUS.NONE); // 옥동 제일리버빌(19세대) 사례
    expect(st(evaluateAt(a(19), "1998-01-01"), "afd")).toBe(STATUS.CHK); // 승강기·난방 미입력
    expect(st(evaluateAt(a(19, { aptElevator: "yes" }), "1998-01-01"), "afd")).toBe(STATUS.REQ);
  });
  test("A5 속보설비 1992.7.28.~ 「바닥면적 1,500㎡ 이상인 층이 있는 것」, 노유자 500㎡ 층은 1999.8.6.부터", () => {
    const shop = bld("retail", {}, { area: 2400, gf: 2, floors: fl(2, 0, 1200) });
    expect(st(evaluateAt(shop, "1995-01-01"), "report")).toBe(STATUS.NONE); // 합계 2,400㎡이지만 1,500㎡ 층 없음
    const noyu = bld("noyu", {}, { area: 600, gf: 1, floors: fl(1, 0, 600) });
    expect(st(evaluateAt(noyu, "1999-08-05"), "report")).toBe(STATUS.NONE);
    expect(st(evaluateAt(noyu, "1999-08-06"), "report")).toBe(STATUS.REQ);
  });
});

describe("B — 쟁점 반영", () => {
  test("B1 옥내소화전 「층수가 4층 이상인 것 중」(2004.5.30.~2024.12.30.) — 1~3층에만 600㎡ 층이면 확인 필요", () => {
    const fls = [{ level: 1, area: 700 }, { level: 2, area: 400 }, { level: 3, area: 400 }, { level: 4, area: 300 }].map((x) => ({ ...x, windowless: false }));
    const b = bld("lodging", {}, { area: 1800, gf: 4, floors: fls }); // 숙박 → 2) 300㎡ 기준은 4층 300㎡로 대상이므로 업무시설 아닌 용도로 600 기준 확인
    const o = bld("edu", {}, { area: 1800, gf: 4, floors: fls }); // 교육연구시설: 1)호 600㎡ 기준만
    expect(st(evaluateAt(o, "2010-01-01"), "hydrant")).toBe(STATUS.CHK);
    expect(st(evaluateAt(o, "2024-12-31"), "hydrant")).toBe(STATUS.NONE);
    expect(st(evaluateAt(o, "2003-01-01"), "hydrant")).toBe(STATUS.NONE);
    expect(st(evaluateAt(b, "2010-01-01"), "hydrant")).toBe(STATUS.REQ);
  });
  test("B2 6층 이상 스프링클러 — 스프링클러 없는 기존 건축물 용도변경은 2018.10.8.부터 제외", () => {
    const t = bld("office", { useChangeNoSpk: true }, { area: 3000, gf: 6, floors: fl(6, 0, 500) });
    expect(st(evaluateAt(t, "2018-10-07"), "spk")).toBe(STATUS.REQ);
    expect(st(evaluateAt(t, "2018-10-08"), "spk")).toBe(STATUS.NONE);
  });
  test("B3① 간이스프링클러 대상에 스프링클러 대체 설치(선택) — 종합점검·감리 반영", () => {
    const r = review({ action: "new", date: "2026-11-23", use: "neigh", area: 1200, gf: 2, bf: 0, floors: fl(2, 0, 600), f: {} }, "2026-11-23");
    expect(r.hist.byKey.sspk.status).toBe(STATUS.REQ);
    expect(r.hist.byKey.spk.status).not.toBe(STATUS.REQ);
    const subs = substitutionsFor(r.hist.rows, r.use);
    const s4 = subs.find((s) => s.id === "s4");
    expect(s4.selfVia).toBe(true);
    expect(s4.selfOpt).toBe(true);
    const items = new Map([["sspk", { key: "sspk", kind: "base" }]]);
    const { applied } = resolveSubs(subs, (s) => s.id === "s4", items);
    expect(applied.map((a) => a.id)).toEqual(["s4"]);
    const list = [{ key: "sspk", kind: "base", sub: applied[0] }];
    expect(inspInstalled(list).get("spk")).toBe(true);
  });
  test("B3② 비상경보설비 대상에 자동화재탐지설비 대체 — 감리자 지정 생략 가능", () => {
    const c = construction({ area: 500, gf: 2, bf: 0, facs: F("afd"), optSupv: F("afd") });
    expect(c.report.status).toBe("대상");
    expect(c.supv.status).toBe("비대상");
    expect(c.supv.optional).toBe(true);
    expect(c.supv.why).toMatch(/지정 생략 가능/);
  });
});

describe("C — 안내·보조", () => {
  test("C1 건설현장 소방안전관리자 — 2022.12.1. 전 허가 신청분 비대상", () => {
    const sm = (date) => siteManager(review({ action: "new", use: "office", area: 16000, gf: 5, bf: 1, f: {}, date }, "2026-11-23"));
    expect(sm("2022-11-30").status).toBe(TT.NO);
    expect(sm("2022-12-01").status).toBe(TT.YES);
    expect(sm("2022-12-01").notes.join(" ")).toMatch(/하나의 건축물\(동\)/);
  });
  test("C3 2012.2.5. 부칙 제6조① — 30층 오피스텔 자동식소화기·속보설비만 새로 소급", () => {
    const r = review({ action: "existing", use: "officetel", area: 30000, gf: 30, bf: 0, floors: fl(30, 0, 1000), f: {}, date: "2010-01-01", completed: "2011-06-01" }, "2026-11-23");
    const rr = r.retro.find((x) => x.id === "retro-2012a");
    expect(rr).toBeTruthy();
    expect(rr.facs).toEqual(expect.arrayContaining(["autoext", "report"]));
    expect(rr.deadline).toBe("2013-02-04");
    // 30층 미만 사무소는 새로 대상이 된 시설이 없어 표시 안 함
    const r2 = review({ action: "existing", use: "office", area: 3000, gf: 5, bf: 0, floors: fl(5, 0, 600), f: {}, date: "2010-01-01", completed: "2011-06-01" }, "2026-11-23");
    expect(r2.retro.find((x) => x.id === "retro-2012a")).toBeFalsy();
  });
  test("C5·C9 실무 안내 — 교육시설법(유치원), 연립·다세대 필로티", () => {
    const k = review({ action: "new", use: "kinder", area: 500, gf: 1, bf: 0, floors: fl(1, 0, 500), f: {}, date: "2026-01-01" }, "2026-11-23");
    expect(practiceNotes(k, "new").map((n) => n.id)).toContain("edu-law");
    const m = review({ action: "new", use: "multi", area: 600, gf: 4, bf: 0, floors: fl(4, 0, 150), f: { households: 8 }, date: "2026-01-01" }, "2026-11-23");
    expect(practiceNotes(m, "new").map((n) => n.id)).toContain("row-piloti");
  });
  test("C10 기존 건축물 속보설비 — 현행 미대상이면 철거 가능 안내", () => {
    const r = review({ action: "existing", use: "office", area: 4000, gf: 2, bf: 0, floors: fl(2, 0, 2000), f: { unmanned: true }, date: "2010-01-01", completed: "2011-01-01" }, "2026-11-23");
    expect(r.hist.byKey.report.status).toBe(STATUS.REQ);
    expect(practiceNotes(r, "existing").map((n) => n.id)).toContain("report-remove");
  });
  test("현장확인 — 시행령 제5조만으로 판단(v2.51.1): 노유자·숙박·스프링클러·캐비닛형 간이스프링클러 → 대상", () => {
    const c = construction({ area: 2000, gf: 3, bf: 0, facs: F("spk", "afd"), site: { uses: ["noyu"] } });
    expect(c.supv.status).toBe("대상");
    expect(c.site.status).toBe("대상");
    expect(construction({ area: 2000, gf: 3, bf: 0, facs: F("hydrant", "afd"), site: { uses: ["lodging"], rooms: "20" } }).site.status).toBe("대상"); // 숙박시설: 객실 수 무관
    const h = construction({ area: 2997.9, gf: 4, bf: 1, facs: F("hydrant", "spk", "afd"), site: { uses: ["medical", "hosp"] } }); // 병원 — 제2호 스프링클러
    expect(h.site.status).toBe("대상");
    expect(h.site.why[0]).toContain("제2호 스프링클러설비");
    expect(construction({ area: 2000, gf: 3, bf: 0, facs: F("hydrant", "sspk", "afd"), cabinetOnly: true, site: { uses: ["office"] } }).site.status).toBe("대상"); // 스프링클러설비등에 캐비닛형 포함
    const c2 = construction({ area: 800, gf: 2, bf: 0, facs: F("afd"), site: { uses: ["office"] } });
    expect(c2.site.status).toBe("갈음");
    const c3 = construction({ area: 300, gf: 1, bf: 0, facs: F("alarm"), site: { uses: ["office"] } });
    expect(c3.site.status).toBe("현장확인");
  });
});
