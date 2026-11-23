import { ERAS, eraOf, dot, mergeDecree, stdNotes, filterRows, lawLink, noText } from "./lawTimeline";

const V = (eff, no, why, pub) => ({ eff, pub: pub || eff, no, kind: "대통령령", why, mst: "9" });

test("시기 구분 — 시행일 기준, 타법폐지는 앞 시기", () => {
  expect(ERAS.map((e) => e.id)).toEqual(["fireact", "maint", "prev", "now"]); // 2012.2.5. 개정은 같은 법(v2.45.1)
  expect(eraOf(V("20040530", "18404", "제정"))).toBe("maint");
  expect(eraOf(V("20040530", "18374", "타법폐지"))).toBe("fireact");
  expect(eraOf(V("20130210", "24304", "일부개정"))).toBe("maint");
  expect(eraOf(V("20160121", "26916", "일부개정"))).toBe("prev");
  expect(eraOf(V("20221201", "33004", "전부개정"))).toBe("now");
  expect(eraOf(V("19580704", "1382", "제정"))).toBe("fireact");
  expect(dot("9999-12-31")).toBe("현재");
  expect(dot("20221201")).toBe("2022.12.1.");
});

test("시행령 설치기준 요약 붙이기 — 번호·시행일 일치, 목록에 없는 시행일은 「부칙 시행」 줄", () => {
  const list = [V("19920728", "13701", "전부개정"), V("20120914", "24100", "일부개정"), V("20120205", "23272", "일부개정"), V("20120205", "23356", "타법개정"), V("20120205", "23571", "일부개정"), V("20221201", "33004", "전부개정")];
  const amend = [
    { eff: "1992-07-28", no: "소방법 시행령", kind: "개정", text: "A" },
    { eff: "2012-09-14", no: "소방시설설치유지법 시행령", kind: "일부개정", text: "B" },
    { eff: "2012-02-05", no: "제23571호", kind: "일부개정", text: "C" },
    { eff: "2024-12-01", no: "제33004호", kind: "시행(부칙)", text: "D" },
    { eff: "2022-09-08", no: "소방청고시 제2022-22호", kind: "일부개정", text: "피난기구의 화재안전기준(NFSC 301) 별표1" },
  ];
  const m = mergeDecree(list, amend);
  const by = (no, eff) => m.find((r) => r.no === no && r.eff === eff);
  expect(by("13701", "19920728").notes.map((a) => a.text)).toEqual(["A"]);
  expect(by("24100", "20120914").notes.map((a) => a.text)).toEqual(["B"]);
  expect(by("23571", "20120205").notes.map((a) => a.text)).toEqual(["C"]);
  expect(by("23272", "20120205").notes).toEqual([]);
  const d = m.find((r) => r.synth);
  expect(d).toMatchObject({ eff: "20241201", no: "33004", why: "부칙 시행", pub: "20221201" });
  expect(m.some((r) => r.notes.some((a) => /NFSC 301/.test(a.text)))).toBe(false); // 화재안전기준 항목은 시행령에서 뺌
  expect(stdNotes("301", amend).map((a) => a.eff)).toEqual(["2022-09-08"]);
  expect(stdNotes("103", amend)).toEqual([]);
});

test("거르기 — 타법개정 숨김(요약 있으면 표시)·시기·최신순", () => {
  const rows = mergeDecree([V("20261002", "36728", "타법개정"), V("20260324", "36220", "타법개정"), V("20251201", "35860", "일부개정"), V("20040530", "18404", "제정")], [{ eff: "2026-10-02", no: "제36728호", text: "현행" }]);
  expect(filterRows(rows).map((r) => r.no)).toEqual(["36728", "35860", "18404"]);
  expect(filterRows(rows, { major: false }).map((r) => r.no)).toEqual(["36728", "36220", "35860", "18404"]);
  expect(filterRows(rows, { era: "maint" }).map((r) => r.no)).toEqual(["18404"]);
  expect(filterRows(rows, { asc: true })[0].no).toBe("18404");
});

test("번호·원문 링크", () => {
  expect(noText({ kind: "대통령령", no: "01382" })).toBe("대통령령 제1382호");
  expect(noText({ kind: "고시", org: "소방청", no: "2022-33", seq: "1" })).toBe("소방청고시 제2022-33호");
  expect(lawLink({ mst: "290451", eff: "20261002" })).toBe("https://www.law.go.kr/lsInfoP.do?lsiSeq=290451&efYd=20261002");
  expect(lawLink({ seq: "2100000270474" })).toBe("https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000270474");
  expect(lawLink({ synth: true, mst: "" })).toBe("");
});

test("설치기준 별표 번호(결과·검토서 근거 문구) — 2012.2.5.~2013.2.9. 별표4, 2013.2.10.부터 별표5", () => {
  const { tableRef } = require("./engine");
  expect(tableRef("2012-02-04")).toBe("구 소방시설설치유지법 시행령 별표4");
  expect(tableRef("2012-02-05")).toBe("구 소방시설설치유지법 시행령 별표4");
  expect(tableRef("2013-02-09")).toBe("구 소방시설설치유지법 시행령 별표4");
  expect(tableRef("2013-02-10")).toBe("구 소방시설설치유지법 시행령 별표5");
  expect(tableRef("2016-01-21")).toBe("구 화재예방소방시설법 시행령 별표5");
  expect(tableRef("2022-12-01")).toBe("소방시설법 시행령 별표4");
});

test("법률·시행규칙 주요 내용 붙이기 — 번호·시행일, 부칙으로 나뉜 줄은 같은 시행일 또는 첫 줄", () => {
  const { mergeNotes } = require("./lawTimeline");
  const { LAW_NOTES, RULE_NOTES } = require("./lawNotes");
  const L = (eff, no, why) => ({ eff, pub: eff, no, kind: "법률", why, mst: "1" });
  const m = mergeNotes([L("20180302", "15419", "일부개정"), L("20180903", "15419", "일부개정"), L("20221201", "18522", "전부개정"), L("20241201", "18522", "전부개정")], LAW_NOTES);
  expect(m.find((r) => r.eff === "20180302").notes).toHaveLength(1);
  expect(m.find((r) => r.eff === "20180903").notes).toHaveLength(0);
  expect(m.find((r) => r.eff === "20221201").notes[0].text).toMatch(/화재예방법 분리/);
  expect(m.filter((r) => r.synth).length).toBe(LAW_NOTES.length - 2); // 목록에 없는 번호는 따로 줄
  const r = mergeNotes([{ eff: "20190813", no: "00132", why: "일부개정" }, { eff: "20200101", no: "00132", why: "일부개정" }, { eff: "20200814", no: "00132", why: "일부개정" }], RULE_NOTES.filter((x) => x.no === "132"));
  expect(r.find((x) => x.eff === "20200101").notes[0].text).toMatch(/30일 → 7일/);
  expect(RULE_NOTES.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.eff) && x.text)).toBe(true);
});
