import { construction, facsFromKeys } from "../construction";

const F = (...k) => Object.fromEntries(k.map((x) => [x, true]));
const run = (p) => construction({ apt: false, ugduct: false, gf: 3, bf: 0, ...p });

describe("착공 계산기 — 별표2 소방기술자", () => {
  test("연면적 1천㎡ 미만 → 자격수첩, 감리 대상(자탐)·일반감리·초급감리원", () => {
    const r = run({ area: 800, facs: F("afd") });
    expect(r.tech.grade).toBe("자격수첩 소방기술자");
    expect(r.tech.fields).toEqual(["전기분야"]);
    expect(r.supv.status).toBe("대상");
    expect(r.supv.kind).toBe("일반 공사감리");
    expect(r.supv.chief).toContain("초급감리원 이상");
    expect(r.supv.assist.need).toBe("없음");
  });
  test("근생 3,000㎡ → 초급, 기계+전기", () => {
    const r = run({ area: 3000, facs: F("hydrant", "afd") });
    expect(r.tech.grade).toBe("초급기술자 이상");
    expect(r.tech.fields).toEqual(["기계분야", "전기분야"]);
  });
  test("제연설비 설치 → 중급 이상(1천㎡ 미만이어도), 감리원 고급+보조(일반감리는 생략 가능)", () => {
    const r = run({ area: 900, facs: F("smoke", "afd") });
    expect(r.tech.grade).toBe("중급기술자 이상");
    expect(r.supv.chief).toContain("고급감리원 이상");
    expect(r.supv.assist.need).toBe("생략 가능");
  });
  test("물분무등 호스릴 방식뿐이면 중급·고급 기준 제외", () => {
    const r = run({ area: 900, facs: F("water", "afd"), hoseReelOnly: true });
    expect(r.tech.grade).toBe("자격수첩 소방기술자");
    expect(r.supv.items.map((x) => x.no)).toEqual(["제5호"]);
  });
  test("아파트 8,000㎡ → 초급(아파트 1천~1만), 감리원 중급", () => {
    const r = run({ apt: true, area: 8000, gf: 10, households: 80, facs: F("spk", "afd") });
    expect(r.tech.grade).toBe("초급기술자 이상");
    expect(r.supv.chief).toContain("중급감리원 이상");
  });
  test("비아파트 3만㎡ → 고급, 상주감리, 특급감리원+보조, 1개 현장 전담", () => {
    const r = run({ area: 30000, gf: 10, facs: F("spk", "afd") });
    expect(r.tech.grade).toBe("고급기술자 이상");
    expect(r.tech.site).toContain("1개 공사 현장");
    expect(r.tech.exclusive).toBe(true);
    expect(r.supv.kind).toBe("상주 공사감리");
    expect(r.supv.chief).toContain("특급감리원 이상");
    expect(r.supv.assist.need).toBe("필요");
  });
  test("아파트 지하2+지상18(20층)·600세대·4만㎡ → 고급, 상주, 특급감리원(16~40층)", () => {
    const r = run({ apt: true, area: 40000, gf: 18, bf: 2, households: 600, facs: F("spk", "afd") });
    expect(r.tech.grade).toBe("고급기술자 이상");
    expect(r.supv.kind).toBe("상주 공사감리");
    expect(r.supv.chief).toContain("특급감리원 이상");
    expect(r.tech.site).toContain("1개 공사 현장");
  });
  test("아파트 20층·400세대 → 일반감리(500세대 미만), 보조 생략 가능", () => {
    const r = run({ apt: true, area: 25000, gf: 20, bf: 0, households: 400, facs: F("spk", "afd") });
    expect(r.supv.kind).toBe("일반 공사감리");
    expect(r.supv.assist.need).toBe("생략 가능");
  });
  test("아파트 15층 3.5만㎡ 900세대 → 상주 아님, 고급감리원(아파트 3만~20만)", () => {
    const r = run({ apt: true, area: 35000, gf: 15, bf: 0, households: 900, facs: F("spk", "afd") });
    expect(r.supv.kind).toBe("일반 공사감리");
    expect(r.supv.chief).toContain("고급감리원 이상");
    expect(r.tech.grade).toBe("중급기술자 이상");
  });
  test("연면적 35만㎡ → 특급·소방기술사, 보조 추가 2명", () => {
    const r = run({ area: 350000, gf: 30, bf: 5, facs: F("spk", "afd") });
    expect(r.tech.grade).toBe("특급기술자");
    expect(r.supv.chief).toContain("소방기술사");
    expect(r.supv.extra).toBe(2);
  });
  test("40층 이상 → 특급", () => {
    const r = run({ area: 20000, gf: 38, bf: 3, facs: F("spk") });
    expect(r.tech.grade).toBe("특급기술자");
    expect(r.supv.chief).toContain("소방기술사");
  });
  test("지하구 → 초급, 감리원 초급", () => {
    const r = run({ ugduct: true, area: "", gf: "", facs: F("spread", "afd") });
    expect(r.tech.grade).toBe("초급기술자 이상");
    expect(r.supv.chief).toContain("초급감리원 이상");
  });
});

describe("착공 계산기 — 착공신고·감리 지정", () => {
  test("비상경보설비만 신설 → 착공신고 대상, 감리 비대상", () => {
    const r = run({ area: 500, facs: F("alarm") });
    expect(r.report.status).toBe("대상");
    expect(r.supv.status).toBe("비대상");
  });
  test("캐비닛형 간이SP뿐 → 감리 제2호 제외, 착공신고는 대상", () => {
    const r = run({ area: 500, facs: F("sspk"), cabinetOnly: true });
    expect(r.report.status).toBe("대상");
    expect(r.supv.status).toBe("비대상");
  });
  test("통합감시시설 → 감리 대상(제6호), 착공신고 목록에는 없음", () => {
    const r = run({ area: 500, facs: F("monitor") });
    expect(r.supv.status).toBe("대상");
    expect(r.report.status).toBe("비대상");
  });
  test("위험물 제조소등 → 착공신고 제외", () => {
    const r = run({ area: 500, hazmat: true, facs: F("afd") });
    expect(r.report.status).toBe("제외");
  });
  test("설비 없음 → 착공신고·감리 비대상", () => {
    const r = run({ area: 500, facs: {} });
    expect(r.report.status).toBe("비대상");
    expect(r.supv.status).toBe("비대상");
    expect(r.tech.none).toBe(true);
  });
  test("입력 누락", () => {
    expect(construction({ apt: true, area: 1000, gf: 5 }).ok).toBe(false);
    expect(construction({ area: "", gf: 3 }).ok).toBe(false);
  });
  test("산정 결과 키 → 계산기 설비", () => {
    expect(facsFromKeys(["ext", "hydrant", "afd", "guide"])).toEqual({ hydrant: true, afd: true });
  });
});
