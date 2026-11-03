import { evaluateAt, review, STATUS, effectAt } from "./engine";
import { CRITERIA } from "./criteria";
import { FACILITIES } from "./facilities";

const floors = (gf, bf, area, wl = []) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: wl.includes(i) });
  return list;
};
const base = (o) => ({ action: "new", f: {}, ...o });
const st = (r, k) => r.byKey[k].status;

describe("규칙 데이터 무결성", () => {
  test("모든 규칙의 시설 키가 존재하고 ID가 고유", () => {
    const keys = new Set(FACILITIES.map((f) => f.key));
    const ids = new Set();
    for (const c of CRITERIA) {
      expect(keys.has(c.fac)).toBe(true);
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.from || c.fromU).toBeTruthy();
      expect(c.to || c.toU).toBeTruthy();
    }
  });
  test("효력 구간 계산", () => {
    expect(effectAt({ from: "2017-01-28", to: "9999-12-31" }, "2017-01-27")).toBe("no");
    expect(effectAt({ from: "2017-01-28", to: "9999-12-31" }, "2017-01-28")).toBe("yes");
    expect(effectAt({ fromU: ["2004-05-30", "2020-12-10"], to: "9999-12-31" }, "2010-01-01")).toBe("maybe");
  });
});

describe("스프링클러 층수 기준 연혁", () => {
  const b = base({ use: "office", area: 4000, gf: 7, bf: 0, floors: floors(7, 0, 571) });
  test("2016년 신청 7층 업무시설 → 당시 11층 기준으로 미대상", () => {
    expect(st(evaluateAt(b, "2016-06-01"), "spk")).toBe(STATUS.NONE);
  });
  test("2017.1.28. 이후 → 6층 이상 설치", () => {
    expect(st(evaluateAt(b, "2017-01-28"), "spk")).toBe(STATUS.REQ);
  });
  test("현행 비교: 업무시설 스프링클러는 소급 없음(법 제13조 본문)", () => {
    const rv = review({ ...b, date: "2016-06-01" }, "2026-11-03");
    const c = rv.compare.find((x) => x.fac.key === "spk");
    expect(c.kind).toBe("added");
    expect(c.retroKind).toMatch(/소급 없음/);
  });
});

describe("부칙 소급", () => {
  test("2010년 노유자 생활시설 200㎡(2008.8.16. 300㎡ 기준 미달) → 2012 부칙 소급(간이SPK·자탐·속보)", () => {
    const rv = review(base({ use: "noyu_res", date: "2010-03-01", area: 200, useArea: 200, gf: 2, bf: 0, floors: floors(2, 0, 100) }), "2026-11-03");
    expect(st(rv.hist, "sspk")).toBe(STATUS.NONE);
    expect(rv.retro.map((r) => r.id)).toContain("retro-noyu2012");
  });
  test("2010년 노유자 생활시설 400㎡ → 당시(2008.8.16.) 300~600㎡ 간이스프링클러 대상", () => {
    const r = evaluateAt(base({ use: "noyu_res", area: 400, useArea: 400, gf: 2, bf: 0, floors: floors(2, 0, 200) }), "2010-03-01");
    expect(r.byKey.sspk.hits.map((h) => h.id)).toContain("sspk-noyu");
  });
  test("2015년 병원 1,000㎡ → 당시 SPK 미대상, 2019 부칙 소급(2026.12.31.)", () => {
    const rv = review(base({ use: "hosp", date: "2015-05-01", area: 1000, gf: 3, bf: 0, floors: floors(3, 0, 333.4) }), "2026-11-03");
    expect(st(rv.hist, "spk")).toBe(STATUS.NONE);
    const r = rv.retro.find((x) => x.id === "retro-hosp2019");
    expect(r.deadline).toBe("2026-12-31");
    expect(st(rv.curr, "spk")).toBe(STATUS.REQ);
  });
});

describe("현행 기준", () => {
  test("아파트 → 자탐 모든 층, 주거용 주방자동소화장치", () => {
    const r = evaluateAt(base({ use: "apt", area: 12000, gf: 15, bf: 1, floors: floors(15, 1, 750) }), "2023-03-01");
    expect(st(r, "afd")).toBe(STATUS.REQ);
    expect(st(r, "autoext")).toBe(STATUS.REQ);
    expect(st(r, "spk")).toBe(STATUS.REQ);
    expect(st(r, "outlet")).toBe(STATUS.REQ);
  });
  test("연면적 32㎡ → 소화기구 해당없음", () => {
    const r = evaluateAt(base({ use: "neigh", area: 32, gf: 1, bf: 0, floors: floors(1, 0, 32) }), "2024-01-01");
    expect(st(r, "ext")).toBe(STATUS.NONE);
  });
  test("지상5+지하2(지하포함 7층) → 연결송수관", () => {
    const r = evaluateAt(base({ use: "office", area: 3000, gf: 5, bf: 2, floors: floors(5, 2, 428.5) }), "2024-01-01");
    expect(st(r, "standpipe")).toBe(STATUS.REQ);
  });
  test("층별 면적 미입력 → 옥내소화전 확인 필요", () => {
    // 연면적 1,200㎡(<1,500) → 층별 300㎡ 기준은 층별 면적 없이 판단 불가
    const r = evaluateAt(base({ use: "office", area: 1200, gf: 4, bf: 1, floors: floors(4, 1, "") }), "2024-01-01");
    expect(st(r, "hydrant")).toBe(STATUS.CHK);
  });
  test("2026.3.1. 이후 지하주차장 300㎡ → 자탐", () => {
    const r = evaluateAt(base({ use: "neigh", area: 500, gf: 2, bf: 1, floors: floors(2, 1, 166.7), f: { ugParking: 300 } }), "2026-04-01");
    expect(st(r, "afd")).toBe(STATUS.REQ);
  });
  test("1992.7.28. 이전 → 미지원 표시 및 설치 판정 하향", () => {
    const r = evaluateAt(base({ use: "office", area: 4000, gf: 12, bf: 0, floors: floors(12, 0, 333.4) }), "1990-01-01");
    expect(r.unsupported).toBe(true);
    expect(st(r, "spk")).toBe(STATUS.REQ_CHK);
  });
});

describe("운영매뉴얼(1992~2015) 연도별 적용기준", () => {
  const office12 = base({ use: "office", area: 4000, gf: 12, bf: 0, floors: floors(12, 0, 333.4) });
  test("2001년 12층 업무시설 → 소방법 '11층 이상의 층' 스프링클러(매뉴얼확인)", () => {
    const r = evaluateAt(office12, "2001-01-01");
    expect(r.unsupported).toBe(false);
    expect(st(r, "spk")).toBe(STATUS.REQ);
    const hit = r.byKey.spk.hits.find((h) => h.id === "spk-old-11f");
    expect(hit.scope).toBe("11층 이상의 층");
    expect(hit.cert).toBe("M");
  });
  const apt15 = base({ use: "apt", area: 15000, gf: 15, bf: 1, floors: floors(15, 1, 937.5) });
  test("아파트 15층 2004.8. 신청 → 스프링클러 미대상(16층 이상 기준)", () => {
    expect(st(evaluateAt(apt15, "2004-08-01"), "spk")).toBe(STATUS.NONE);
  });
  test("아파트 15층 2005.1.1. 이후 신청 → 11층 이상 전 층 스프링클러", () => {
    expect(st(evaluateAt(apt15, "2006-03-01"), "spk")).toBe(STATUS.REQ);
  });
  test("아파트 20층 2000년 → 16층 이상의 층 스프링클러, 6층 이상 자동식소화기", () => {
    const r = evaluateAt(base({ use: "apt", area: 20000, gf: 20, bf: 1, floors: floors(20, 1, 952) }), "2000-01-01");
    expect(r.byKey.spk.hits.map((h) => h.id)).toContain("spk-apt16");
    expect(r.byKey.autoext.hits.map((h) => h.id)).toContain("auto-apt97");
  });
  test("1993년 지하 2층 → 피난기구는 지하층 제외(1994.7.20. 전)", () => {
    const b = base({ use: "office", area: 600, gf: 2, bf: 2, floors: floors(2, 2, 150) });
    expect(st(evaluateAt(b, "1993-06-01"), "escape")).toBe(STATUS.NONE);
    expect(st(evaluateAt(b, "1995-01-01"), "escape")).toBe(STATUS.REQ);
  });
  test("터널 연결송수관: 2007 2,000m / 2010 1,000m / 2026.3.1. 이후 500m", () => {
    const t = (len) => base({ use: "tunnel", area: 0, gf: 0, bf: 0, floors: [], f: { tunnelLen: len } });
    expect(st(evaluateAt(t(1500), "2007-01-01"), "standpipe")).toBe(STATUS.NONE);
    expect(st(evaluateAt(t(1500), "2010-01-01"), "standpipe")).toBe(STATUS.REQ);
    expect(st(evaluateAt(t(700), "2025-01-01"), "standpipe")).toBe(STATUS.NONE);
    expect(st(evaluateAt(t(700), "2026-04-01"), "standpipe")).toBe(STATUS.REQ);
  });
  test("요양병원 400㎡ 2016년 → 자탐·속보 면적 무관(2015.7.1.)", () => {
    const r = evaluateAt(base({ use: "nursing", area: 400, useArea: 400, gf: 1, bf: 0, floors: floors(1, 0, 400) }), "2016-01-01");
    expect(st(r, "afd")).toBe(STATUS.REQ);
    expect(st(r, "report")).toBe(STATUS.REQ);
  });
});

describe("증축 특례", () => {
  test("구획 예외 없음 → 전체 증축일 기준", () => {
    const rv = review(
      base({ use: "office", date: "2010-01-01", date2: "2023-01-01", action: "extension", area: 4000, gf: 7, bf: 0, floors: floors(7, 0, 571), extExceptions: {} }),
      "2026-11-03"
    );
    expect(rv.primaryDate).toBe("2023-01-01");
    expect(st(rv.hist, "spk")).toBe(STATUS.REQ);
  });
  test("내화구조 구획 → 기존/증축 부분 분리", () => {
    const rv = review(
      base({ use: "office", date: "2010-01-01", date2: "2023-01-01", action: "extension", area: 4000, gf: 7, bf: 0, floors: floors(7, 0, 571), extExceptions: { fireproof: true } }),
      "2026-11-03"
    );
    expect(rv.primaryDate).toBe("2010-01-01");
    expect(rv.secondary.date).toBe("2023-01-01");
  });
  const ext = (date2, ex) =>
    review(
      base({ use: "office", date: "2010-01-01", date2, action: "extension", area: 4000, gf: 7, bf: 0, floors: floors(7, 0, 571), extExceptions: ex }),
      "2026-11-04"
    );
  test("60분 방화문 구획 — 2022.12.1. 이후 증축 신청분: 부칙 제3조 소급으로 분리 적용", () => {
    const rv = ext("2023-06-01", { door60: true });
    expect(rv.primaryDate).toBe("2010-01-01");
    expect(rv.secondary.date).toBe("2023-06-01");
    expect(rv.ext.notes.join(" ")).toMatch(/부칙.*제3조/);
  });
  test("60분 방화문 구획 — 2022.12.1. 전 증축 신청분: 구 갑종방화문 기준으로 분리, 확인 필요 안내", () => {
    const rv = ext("2021-06-01", { door60: true });
    expect(rv.primaryDate).toBe("2010-01-01");
    expect(rv.ext.notes.join(" ")).toMatch(/갑종방화문/);
  });
  test("60분+ 방화문 구획 → 분리 적용", () => {
    expect(ext("2026-01-01", { door60plus: true }).primaryDate).toBe("2010-01-01");
  });
});

describe("노유자 생활시설 구분(2012.2.5. 도입)", () => {
  const dc = (date, f = {}, use = "noyu_res") =>
    evaluateAt(base({ use, area: 200, useArea: 200, gf: 1, bf: 0, floors: floors(1, 0, 200), f }), date);
  test("주·야간보호(재가노인복지시설)는 노유자 생활시설 → 2012.2.5. 이후 200㎡도 간이SPK·자탐·속보", () => {
    const r = dc("2015-01-01");
    expect(st(r, "sspk")).toBe(STATUS.REQ);
    expect(st(r, "afd")).toBe(STATUS.REQ);
    expect(st(r, "report")).toBe(STATUS.REQ);
  });
  test("2012.2.5. 전에는 구분 없이 노유자시설 면적 기준 → 200㎡는 해당없음", () => {
    const r = dc("2011-06-01");
    expect(st(r, "sspk")).toBe(STATUS.NONE);
    expect(st(r, "afd")).toBe(STATUS.NONE);
  });
  test("아동·장애인 생활시설이 공동주택에 설치(2013.2.10. 이후) → 생활시설 제외, 면적 기준", () => {
    const r = dc("2015-01-01", { noyuInHouse: true }, "noyu_res2");
    expect(r.byKey.sspk.hits.map((h) => h.id)).not.toContain("sspk-noyures");
    expect(st(r, "afd")).toBe(STATUS.NONE);
  });
  test("노인시설(가목1)은 공동주택 설치여도 생활시설 유지", () => {
    const r = dc("2015-01-01", { noyuInHouse: true }, "noyu_res");
    expect(st(r, "afd")).toBe(STATUS.REQ);
  });
  test("2011년 신청 주·야간보호 → 2012 부칙 소급 표시", () => {
    const rv = review(base({ use: "noyu_res", date: "2011-06-01", area: 200, useArea: 200, gf: 1, bf: 0, floors: floors(1, 0, 200) }), "2026-11-04");
    expect(rv.retro.map((r) => r.id)).toContain("retro-noyu2012");
  });
});
