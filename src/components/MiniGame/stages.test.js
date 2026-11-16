// 중급·고급 단계 문항 — HFLS 착공·안전관리 판정 함수 결과와 정답 연결 확인
import { startQuestions, postQuestions, gradeAnswers, answerLabel } from "./stagesAdapter";

const ans = (r) => Object.fromEntries(r.qs.map((q) => [q.id, q.chk ? "chk" : q.ans]));
const D = "2026.01.05";

describe("착공 단계(중급)", () => {
  test("근생 지상2층 250㎡×2 — 비상경보설비만 착공신고 대상, 감리 비대상", () => {
    const a = ans(startQuestions({ use: "retail", GF: 2, BF: 0, A: 250, Ab: 0, date: D }));
    expect(a).toMatchObject({ report: "y", tech: "0", supv: "n", flame: "n", lane: "n", site: "n" });
    expect(a.temp.sort()).toEqual(["alarm", "blanket", "ext"]); // 연면적 400㎡ 이상 → 소화기(동의대상)·비상경보장치, 방화포
  });
  test("아파트 지상25층·지하2층 150세대 — 고급기술자·특급감리원, 전용구역·현장 안전관리자 대상", () => {
    const a = ans(startQuestions({ use: "apt", GF: 25, BF: 2, A: 600, Ab: 3000, hh: 150, H: 82.5, date: D }));
    expect(a).toMatchObject({ report: "y", tech: "3", supv: "y", supvLv: "4", flame: "n", lane: "y", site: "y" });
  });
  test("방염 — 숙박시설(제7호)·노유자(제5호)·의료시설(제3호) 대상, 업무시설 11층 이상(제10호) 대상, 10층 이하 비대상", () => {
    const fl = (b) => ans(startQuestions({ BF: 0, Ab: 0, date: D, ...b })).flame;
    expect(fl({ use: "lodging", GF: 3, A: 200 })).toBe("y");
    expect(fl({ use: "daycare", GF: 1, A: 200 })).toBe("y");
    expect(fl({ use: "hospital", GF: 3, A: 300 })).toBe("y");
    expect(fl({ use: "office", GF: 11, A: 500 })).toBe("y");
    expect(fl({ use: "office", GF: 10, A: 500 })).toBe("n");
  });
  test("아파트 99세대 — 소방자동차 전용구역 비대상(100세대 미만)", () => {
    expect(ans(startQuestions({ use: "apt", GF: 11, BF: 1, A: 500, Ab: 1500, hh: 99, H: 36.3, date: D })).lane).toBe("n");
  });
  test("단독주택 — 착공신고·감리 비대상, 임시소방시설 소화기는 확인 필요(채점 제외)", () => {
    const r = startQuestions({ use: "house", GF: 1, BF: 0, A: 100, Ab: 0, date: D });
    expect(ans(r)).toMatchObject({ report: "n", supv: "n" });
    expect(r.qs.find((q) => q.id === "temp").free).toContain("ext");
  });
});

describe("준공 후(중급)·관리(고급)", () => {
  test("근생 500㎡ — 소방안전관리대상물·자체점검 아님", () => {
    expect(ans(postQuestions({ use: "retail", GF: 2, BF: 0, A: 250, Ab: 0, date: D, today: D }, false))).toMatchObject({ grade: "none", insp: "none" });
  });
  test("아파트 25층 — 2급, 작동+종합점검(스프링클러)", () => {
    expect(ans(postQuestions({ use: "apt", GF: 25, BF: 2, A: 600, Ab: 3000, hh: 150, H: 82.5, date: D, today: D }, false))).toMatchObject({ grade: "2급", insp: "both" });
  });
  test("업무시설 지상30층·지하4층 — 특급, 종합점검(반기)", () => {
    expect(ans(postQuestions({ use: "office", GF: 30, BF: 4, A: 1500, Ab: 2500, H: 99, date: D, today: D }, false))).toMatchObject({ grade: "특급", insp: "top" });
  });
  test("고급: 2017년 허가 아파트 — 전용구역 비대상(2018.8.10. 전 신청)", () => {
    const a = ans(postQuestions({ use: "apt", GF: 15, BF: 1, A: 500, Ab: 2000, hh: 120, H: 49.5, date: "2017.03.10", done: "2018.11.01", today: D }, true));
    expect(a).toMatchObject({ lane: "n", grade: "2급", insp: "both" });
  });
  test("고급: 2020년 허가 아파트 120세대 — 전용구역 대상", () => {
    expect(ans(postQuestions({ use: "apt", GF: 15, BF: 1, A: 500, Ab: 2000, hh: 120, H: 49.5, date: "2020.03.10", done: "2021.11.01", today: D }, true)).lane).toBe("y");
  });
});

describe("채점", () => {
  const qs = [
    { id: "p", kind: "one", opts: [], ans: "n" },
    { id: "c", kind: "one", parent: { id: "p", v: "y" }, opts: [], ans: "3" },
    { id: "x", kind: "one", opts: [], ans: "y", chk: true },
    { id: "m", kind: "multi", opts: [], ans: ["a"], free: ["b"] },
  ];
  test("상위 정답이 비대상이면 하위 문항 채점 안 함 · 확인 필요 제외 · 복수 선택의 확인 필요 항목은 자유", () => {
    expect(gradeAnswers(qs, { p: "n", m: ["a", "b"] })).toEqual({ wrong: [], scored: 2 });
    expect(gradeAnswers(qs, { p: "y", m: ["a"] }).wrong).toEqual(["p"]);
    expect(gradeAnswers(qs, { p: "n", m: ["b"] }).wrong).toEqual(["m"]);
    expect(gradeAnswers(qs, { p: "n", m: ["a", "z"] }).wrong).toEqual(["m"]);
  });
  test("상위 정답이 대상이면 하위 문항도 채점", () => {
    const q2 = [{ id: "p", kind: "one", opts: [], ans: "y" }, { id: "c", kind: "one", parent: { id: "p", v: "y" }, opts: [{ v: "3", label: "고급" }], ans: "3" }];
    expect(gradeAnswers(q2, { p: "y" }).wrong).toEqual(["c"]);
    expect(gradeAnswers(q2, { p: "y", c: "3" })).toEqual({ wrong: [], scored: 2 });
    expect(answerLabel(q2[1])).toBe("고급");
  });
});

describe("게임 건물 무작위 표본 — 모든 단계 문항이 오류 없이 만들어지고 정답이 선택지 안에 있음", () => {
  const TPL = [
    ["house", [1, 2], [60, 150]], ["retail", [1, 5], [70, 450], [0, 1], [80, 520]], ["multi", [3, 4], [110, 165]], ["daycare", [1, 2], [120, 300]],
    ["lodging", [2, 10], [70, 600], [0, 2], [60, 900]], ["factory", [1, 2], [400, 2600]], ["nursing", [1, 4], [120, 450]],
    ["office", [4, 35], [300, 1800], [0, 5], [300, 3200]], ["hospital", [2, 6], [140, 700], [0, 1], [120, 600]],
    ["sales", [1, 6], [400, 4000], [0, 3], [140, 4000]], ["apt", [5, 29], [350, 700], [1, 3], [900, 6000]],
  ];
  let seed = 11;
  const rnd = (a, b) => { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); };
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const sample = (date) => {
    const out = [];
    for (const [use, gf, a, bf, ab] of TPL) for (let i = 0; i < 25; i++) {
      const GF = ri(gf[0], gf[1]);
      const BF = bf ? ri(bf[0], bf[1]) : 0;
      const b = { use, GF, BF, A: Math.round(rnd(a[0], a[1]) * 100) / 100, Ab: BF ? Math.round(rnd(ab[0], ab[1]) * 100) / 100 : 0, H: Math.round(GF * 33) / 10, date, today: D };
      if (use === "apt") b.hh = GF * ri(2, 6);
      if (use === "multi") b.hh = GF * ri(2, 4);
      out.push(b);
    }
    return out;
  };
  const valid = (r) => {
    for (const q of r.qs) {
      if (q.kind === "multi") { for (const v of [...q.ans, ...(q.free || [])]) expect(q.opts.map((o) => o.v)).toContain(v); continue; }
      if (q.chk) continue;
      const p = q.parent && r.qs.find((x) => x.id === q.parent.id);
      if (p && p.ans !== q.parent.v) continue;
      expect(q.opts.map((o) => o.v)).toContain(q.ans);
    }
  };
  test("중급(현행)", () => {
    for (const b of sample(D)) { const s = startQuestions(b); expect(s.qs.length).toBe(8); valid(s); valid(postQuestions({ ...b, today: D }, false)); }
  });
  test("고급(1993~2025년 허가)", () => {
    const years = [1993, 1998, 2003, 2006, 2010, 2014, 2018, 2022, 2025];
    for (const y of years) for (const b of sample(`${y}.04.15`)) { const r = postQuestions({ ...b, done: `${y + 1}.06.30` }, true); expect(r.qs.length).toBe(3); valid(r); }
  });
});
