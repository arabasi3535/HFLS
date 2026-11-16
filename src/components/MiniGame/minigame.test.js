// 「소방 인허가 시티」 판정 어댑터 검증 — HFLS 판정 엔진 결과와 게임 판정 연결 확인
import { evaluate, extrasOf, USE_MAP, SYS_MAP } from "./rulesAdapter";
import { legacyEvaluate, SYSTEMS } from "./legacyRules";
import { getUse } from "../../law/uses";
import { getFacility } from "../../law/facilities";

const req = (b) => { const e = evaluate({ date: "2026.01.05", ...b }); return SYSTEMS.filter((s) => e[s.id].req).map((s) => s.id).sort(); };
const ids = (s) => s.split(" ").sort();

describe("매핑", () => {
  test("게임 용도·설비가 모두 HFLS에 있음", () => {
    for (const u of Object.values(USE_MAP)) expect(getUse(u)).toBeTruthy();
    for (const k of Object.values(SYS_MAP)) expect(getFacility(k)).toBeTruthy();
    expect(Object.keys(SYS_MAP).sort()).toEqual(SYSTEMS.map((s) => s.id).sort());
  });
});

describe("지시서 검증 표본 — HFLS 판정", () => {
  test("근생 지상2층 250㎡×2", () => expect(req({ use: "retail", GF: 2, BF: 0, A: 250, Ab: 0 })).toEqual(ids("ext alarm exitlight")));
  test("근생 지상5층 400㎡ + 지하1층 300㎡", () =>
    expect(req({ use: "retail", GF: 5, BF: 1, A: 400, Ab: 300 })).toEqual(ids("ext hyd ssp afd visual escape exitlight")));
  test("다세대 지상4층 150㎡", () => expect(req({ use: "multi", GF: 4, BF: 0, A: 150, Ab: 0 })).toEqual(ids("ext ssp single escape exitlight")));
  test("노인요양 지상2층 250㎡", () =>
    expect(req({ use: "nursing", GF: 2, BF: 0, A: 250, Ab: 0 })).toEqual(ids("ext ssp afd visual report escape exitlight")));
  test("아파트 지상15층 600㎡ + 지하2층 3,000㎡", () =>
    expect(req({ use: "apt", GF: 15, BF: 2, A: 600, Ab: 3000 })).toEqual(
      ids("ext kitchen hyd sp afd broadcast escape exitlight emlight water standpipe outlet radio")
    ));
  test("숙박시설 → 휴대용비상조명등 설치(별표4 제3호마목), 다른 용도는 비대상", () => {
    expect(req({ use: "lodging", GF: 3, BF: 0, A: 200, Ab: 0 })).toContain("plight");
    for (const use of ["retail", "office", "sales", "hospital", "apt"]) expect(req({ use, GF: 3, BF: 0, A: 300, Ab: 0 })).not.toContain("plight");
  });
  test("휴대용비상조명등 연혁(고급) — 소방법 2002.3.30. 신설 전 숙박시설은 비대상, 이후 대상", () => {
    const lodge = { use: "lodging", GF: 3, BF: 0, A: 200, Ab: 0 };
    const at = (date) => evaluate({ ...lodge, date }).plight;
    expect(at("2001.05.01").req).toBe(false);
    expect(at("2003.05.01").req || at("2003.05.01").chk).toBe(true);
    expect(at("2010.05.01").req).toBe(true);
  });
  test("단독주택 → 주택용소방시설(소화기·단독경보형)만", () => expect(req({ use: "house", GF: 2, BF: 0, A: 100, Ab: 0 })).toEqual(ids("ext single")));
});

describe("HFLS 기준을 따름(기존 rules.js와 다른 부분)", () => {
  test("지하층 피난기구 — HFLS는 비대상, 기존 rules.js는 대상", () => {
    const b = { use: "retail", GF: 2, BF: 1, A: 260, Ab: 80, date: "2026.01.05" };
    expect(evaluate(b).escape.req).toBe(false);
    expect(legacyEvaluate(b).escape.req).toBe(true);
  });
  test("비상방송설비 — 지상 10층·지하 1층·연면적 3,500㎡ 미만: HFLS 비대상(지하층 제외 층수), 기존 대상", () => {
    const b = { use: "lodging", GF: 10, BF: 1, A: 300, Ab: 300, date: "2026.01.05" };
    expect(evaluate(b).broadcast.req).toBe(false);
    expect(legacyEvaluate(b).broadcast.req).toBe(true);
  });
  test("근거 문구에 HFLS 법령 조항 포함", () => {
    const e = evaluate({ use: "apt", GF: 15, BF: 2, A: 600, Ab: 3000, date: "2026.01.05" });
    expect(e.sp.why).toContain("별표4 제1호라목");
    expect(e.alarm.why).toContain("별표5");
  });
  test("게임 선택지 밖 HFLS 판정(아파트 지하주차장 물분무등)은 참고로 표시", () => {
    const ex = extrasOf({ use: "apt", GF: 15, BF: 2, A: 600, Ab: 3000, date: "2026.01.05" });
    expect(ex.map((e) => e.name)).toContain("물분무등소화설비");
  });
});

describe("게임 템플릿 무작위 표본 — 기존 rules.js와의 차이는 아래 2가지뿐(HFLS 기준 채택)", () => {
  // ① 지하층 피난기구: HFLS 비대상(NFTC 301 표 2.1.1 지하층 적응 기구 없음)
  // ② 비상방송설비 11층: HFLS는 지하층 제외 층수(시행령 별표4 제2호바목2)), 기존은 지하층 포함으로 계산
  const TPL = [
    ["retail", [1, 5], [70, 450], [0, 1], [80, 520]], ["multi", [3, 4], [110, 165]], ["daycare", [1, 2], [120, 300]],
    ["lodging", [2, 10], [70, 600], [0, 2], [60, 900]], ["factory", [1, 2], [400, 2600]], ["nursing", [1, 4], [120, 450]],
    ["office", [4, 35], [300, 1800], [0, 5], [300, 3200]], ["hospital", [2, 6], [140, 700], [0, 1], [120, 600]],
    ["sales", [1, 6], [400, 4000], [0, 3], [140, 4000]], ["apt", [5, 29], [350, 700], [1, 3], [900, 6000]], ["house", [1, 2], [60, 150]],
  ];
  let seed = 7;
  const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  test.each(["2026.01.05", "2026.06.01"])("기준일 %s", (date) => {
    const diffs = new Set();
    for (const [use, gf, a, bf, ab] of TPL) for (let i = 0; i < 300; i++) {
      const GF = ri(gf[0], gf[1]); let A = Math.round(rnd(a[0], a[1]) * 100) / 100; if (use === "multi") A = Math.min(A, 164);
      const BF = bf ? ri(bf[0], bf[1]) : 0, Ab = BF ? Math.round(rnd(ab[0], ab[1]) * 100) / 100 : 0;
      const b = { use, GF, BF, A, Ab, date };
      const n = evaluate(b), o = legacyEvaluate(b);
      for (const s of SYSTEMS) if (!n[s.id].chk && n[s.id].req !== o[s.id].req) diffs.add(
        s.id === "escape" && BF > 0 && !n.escape.req ? "escape-basement"
        : s.id === "broadcast" && GF < 11 && GF + BF >= 11 && !n.broadcast.req ? "pa-basement-count"
        : `${use}:${s.id}`);
    }
    expect([...diffs].filter((d) => d !== "escape-basement" && d !== "pa-basement-count")).toEqual([]);
  });
});
