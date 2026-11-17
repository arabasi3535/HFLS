import { review } from "../engine";
import { tempFacilities, T } from "../temporary";

const floors = (gf, bf, area, wl = []) => {
  const list = [];
  for (let i = bf; i >= 1; i--) list.push({ level: -i, area, windowless: false });
  for (let i = 1; i <= gf; i++) list.push({ level: i, area, windowless: wl.includes(i) });
  return list;
};
const tp = (o) => {
  const r = tempFacilities(review({ action: "new", f: {}, date: "2026-11-15", ...o }, "2026-11-15"));
  return { r, s: Object.fromEntries(r.items.map((i) => [i.key, i.status])) };
};

describe("임시소방시설 — 시행령 별표8 제2호", () => {
  test("연면적 4,000㎡ 지상 7층 사무소(지하 없음, 층 571㎡): 소화기·간이소화장치·비상경보장치 대상, 지하·무창 기준 비대상", () => {
    const { s } = tp({ use: "office", area: 4000, gf: 7, bf: 0, floors: floors(7, 0, 571) });
    expect(s.ext).toBe(T.YES);
    expect(s.simple).toBe(T.YES); // 연면적 3천㎡ 이상
    expect(s.alarm).toBe(T.YES);
    expect(s.gas).toBe(T.NO);
    expect(s.guide).toBe(T.NO);
    expect(s.light).toBe(T.NO);
    expect(s.blanket).toBe(T.YES);
  });
  test("연면적 2,000㎡, 지하 1층 600㎡: 간이소화장치(지하층 600㎡) 및 지하층 150㎡ 기준 모두 대상", () => {
    const { s, r } = tp({ use: "office", area: 2000, gf: 3, bf: 1, floors: [{ level: -1, area: 600 }, { level: 1, area: 500 }, { level: 2, area: 450 }, { level: 3, area: 450 }] });
    expect(s.simple).toBe(T.YES);
    expect(s.gas).toBe(T.YES);
    expect(s.light).toBe(T.YES);
    expect(r.items.find((i) => i.key === "simple").why).toContain("지하1층");
  });
  test("연면적 2,000㎡, 4층 이상 층 바닥면적 500㎡: 간이소화장치 비대상", () => {
    const { s } = tp({ use: "office", area: 2000, gf: 4, bf: 0, floors: floors(4, 0, 500) });
    expect(s.simple).toBe(T.NO);
    expect(s.alarm).toBe(T.YES);
  });
  test("무창층 표시된 2층 200㎡: 지하·무창 150㎡ 기준 대상", () => {
    const { s } = tp({ use: "office", area: 380, gf: 2, bf: 0, floors: floors(2, 0, 190, [2]) });
    expect(s.alarm).toBe(T.YES);
    expect(s.guide).toBe(T.YES);
    expect(s.ext).toBe(T.YES); // 동의대상 제2호
  });
  test("층별 면적 미입력 + 지하층: 층 기준은 확인 필요", () => {
    const { s } = tp({ use: "office", area: 1000, gf: 2, bf: 1, floors: [] });
    expect(s.gas).toBe(T.CHK);
    expect(s.simple).toBe(T.CHK);
    expect(s.alarm).toBe(T.YES); // 연면적 400㎡ 이상
  });
  test("연면적 300㎡ 2층 근린생활시설(지하 없음): 소화기는 동의대상 확인 필요", () => {
    const { s } = tp({ use: "neigh", area: 300, gf: 2, bf: 0, floors: floors(2, 0, 150) });
    expect(s.ext).toBe(T.CHK);
    expect(s.alarm).toBe(T.NO);
  });
});

describe("임시소방시설 소화기 — 건축허가등 동의대상(시행령 제7조제1항) 보완 항목(v2.38.0)", () => {
  const ext = (o) => tp(o).r.items.find((i) => i.key === "ext");
  test("입원실 있는 의원 300㎡(400㎡ 미만) → 제6호로 동의대상", () => {
    const e = ext({ use: "clinic", area: 300, gf: 1, bf: 0, floors: floors(1, 0, 300), f: { inpatient: true } });
    expect(e.status).toBe(T.YES);
    expect(e.why).toContain("입원실");
  });
  test("항공기 격납고 300㎡ → 제5호", () => {
    expect(ext({ use: "hangar", area: 300, gf: 1, bf: 0, floors: floors(1, 0, 300) }).why).toContain("항공기 격납고(제5호)");
  });
  test("특수가연물 750배 공장 300㎡ → 제9호, 749배는 미해당", () => {
    expect(ext({ use: "factory", area: 300, gf: 1, bf: 0, floors: floors(1, 0, 300), f: { combustibleTimes: 750 } }).why).toContain("제9호");
    expect(ext({ use: "factory", area: 300, gf: 1, bf: 0, floors: floors(1, 0, 300), f: { combustibleTimes: 749 } }).status).toBe(T.CHK);
  });
  test("가스시설 지상 노출 탱크 100톤 → 제10호", () => {
    expect(ext({ use: "gas", area: 50, gf: 1, bf: 0, floors: floors(1, 0, 50), f: { gasTankTon: 100 } }).why).toContain("제10호");
  });
});
