// 관계인 작동점검 보고서 — 데이터·매핑 테스트
import { rowItems, defectText, stationFor, emptyReport, applySeed, missingFields, defects, ALL_ROWS, M_ROWS, rowState } from "../report";
import { CL_ITEMS } from "../checklist";

const row = (id) => [...ALL_ROWS, ...M_ROWS].find((r) => r.id === id);

describe("점검표(고시 별지 제4호서식) 작동점검 항목", () => {
  test("소화기구 1-A는 ○ 항목 8개(설치수량·약제 적응성 ●은 제외)", () => {
    const it = rowItems(row("ext"));
    expect(it.length).toBe(8);
    expect(it[0].code).toBe("1-A-001");
    expect(it.map((x) => x.code)).not.toContain("1-A-009");
  });
  test("자동화재탐지설비 항목 존재, 종합 전용(15-A 경계구역) 제외", () => {
    const codes = rowItems(row("afd")).map((x) => x.code);
    expect(codes).toContain("15-B-001");
    expect(codes.some((c) => c.startsWith("15-A"))).toBe(false);
  });
  test("주거용 주방자동소화장치는 1-B-001~006만", () => {
    expect(rowItems(row("auto_res")).map((x) => x.code)).toEqual(["1-B-001", "1-B-002", "1-B-003", "1-B-004", "1-B-005", "1-B-006"]);
  });
  test("모든 섹션(1~32) 수록", () => {
    for (let i = 1; i <= 32; i++) expect(CL_ITEMS[String(i)] !== undefined || i === 31).toBe(true);
  });
});

describe("자동화", () => {
  test("불량내용 기본 문구", () => {
    expect(defectText("지시압력계(녹색범위)의 적정 여부")).toBe("지시압력계(녹색범위) 불량");
  });
  test("경북 시·군 → 관할 소방서 자동", () => {
    expect(stationFor("경상북도 안동시 경동로 1")).toBe("안동소방서장");
    expect(stationFor("경상북도 영주시 대학로 1")).toBe("영주소방서장");
    expect(stationFor("경북 칠곡군 왜관읍 1")).toBe("칠곡소방서장");
    expect(stationFor("경상북도 포항시 남구 지곡로 1")).toBe("포항남부소방서장");
    expect(stationFor("경상북도 포항시 북구 중앙로 1")).toBe("포항북부소방서장");
    expect(stationFor("경상북도 포항시 중앙로 1")).toBe("");
    expect(stationFor("경상북도 울릉군 울릉읍 1")).toBe("포항남부소방서장");
    expect(stationFor("대구광역시 군위군 군위읍 1")).toBe("");
    expect(stationFor("경상북도 영양군 영양읍 1")).toBe("영양소방서장");
    expect(stationFor("서울특별시 종로구 1")).toBe("");
    expect(stationFor("경상북도 영주시 1", "직접소방서장")).toBe("직접소방서장");
  });
  test("검토 결과 반영: 소화기·자탐·유도등 → 설치 체크, 비상구 기본 체크", () => {
    const r = applySeed(emptyReport(), { at: 1, useLabel: "근린생활시설", area: 900, gf: 3, facs: ["ext", "afd", "visual", "guide", "escape"] });
    expect(rowState(r, row("ext")).on).toBe(true);
    expect(rowState(r, row("afd")).res).toBe("○");
    expect(rowState(r, row("sign")).on).toBe(true);
    expect(rowState(r, row("esc_a")).on).toBe(true);
    expect(rowState(r, row("exit")).on).toBe(true);
    expect(rowState(r, row("sspk")).res).toBe("/");
  });
  test("필수 입력: 점검자 3명", () => {
    const r = emptyReport();
    const m = missingFields(r);
    expect(m).toContain("점검자 1 성명");
    expect(m).toContain("점검자 3 성명");
  });
  test("불량 선택 → 불량 목록·결과 ×", () => {
    const r = applySeed(emptyReport(), { at: 1, facs: ["ext"] });
    r.rows.ext.bad = { "1-A-007": { text: "지시압력계(녹색범위) 불량", qty: "2층 2개" } };
    expect(rowState(r, row("ext")).res).toBe("×");
    expect(rowState(r, row("g_ext")).res).toBe("×");
    const d = defects(r);
    expect(d[0]).toMatchObject({ cat: "소화설비", code: "1-A-007" });
  });
});

describe("자체점검 보고서 종류(v2.14)", () => {
  const { VARIANTS, mainQualWarn } = require("../report");
  const row = (id) => ALL_ROWS.find((r) => r.id === id);
  test("종합점검은 ● 항목 포함", () => {
    const op = rowItems(row("spk"));
    const cp = rowItems(row("spk"), true);
    expect(op.every((x) => x.k === "○")).toBe(true);
    expect(cp.length).toBeGreaterThan(op.length);
    expect(cp.some((x) => x.k === "●")).toBe(true);
  });
  test("관리업 기본값·필수 입력", () => {
    const r = emptyReport("mgmt");
    expect(r.kind).toBe("mgmt");
    expect(r.checker).toBe("mgmt");
    expect(r.toWhom).toBe("관계인");
    const m = missingFields(r);
    expect(m).toContain("관리업자 업체명");
    expect(m).toContain("소방안전관리등급");
    expect(m).not.toContain("제출할 소방서");
    expect(m).not.toContain("관계인 전화번호");
  });
  test("최초점검 기본값: 전년도 점검 미실시", () => {
    const r = emptyReport("compFirst");
    expect(r.prevOp).toBe("미실시");
    expect(r.prevComp).toBe("미실시");
    expect(emptyReport("comp").prevComp).toBe("실시");
  });
  test("주된 점검인력 자격(별표3)", () => {
    const r = emptyReport("mgmt");
    expect(mainQualWarn(r)).toBe("");
    r.inspectors[0].qual = "특급점검자";
    expect(mainQualWarn(r)).toBe("");
    const c = emptyReport("comp");
    c.inspectors[0].qual = "특급점검자";
    expect(mainQualWarn(c)).not.toBe("");
    c.checker = "manager";
    c.inspectors[0].qual = "소방기술사";
    expect(mainQualWarn(c)).toBe("");
    expect(Object.keys(VARIANTS)).toEqual(["owner", "mgmt", "compFirst", "comp"]);
  });
});
