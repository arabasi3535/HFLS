// ============================================================
// 건설현장 임시소방시설 — 신축 공사 시 설치 대상 판정
//
//  근거
//   - 소방시설법 제15조(건설현장의 임시소방시설 설치 및 관리)
//   - 같은 법 시행령 제18조(화재위험작업 및 임시소방시설 등) 및 [별표 8]
//       제1호 종류 · 제2호 설치 공사의 종류와 규모 · 제3호 설치한 것으로 보는 소방시설
//   - 건설현장의 화재안전성능기준(NFPC 606, 소방청고시 제2023-23호, 2023.7.1. 시행)
//   - 건설현장의 화재안전기술기준(NFTC 606, 2023.7.1. 시행)
//  확인 자료: 2025년도 소방시설법령 해설서(시행령 제36220호, 2026.3.24. 시행 기준 수록)
//            + NFPC 606 원문(국가법령정보센터, 2026.11.15. 출력본)
//
//  판정 범위
//   - 별표8 제2호의 '공사의 규모'(연면적·층 바닥면적)만 판정. 실제 설치 의무는
//     공사 현장에서 화재위험작업(시행령 제18조제1항)을 할 때 생김.
//   - 소화기는 '건축허가등의 동의를 받아야 하는 특정소방대상물'의 공사가 요건 →
//     동의대상(시행령 제7조제1항)을 입력값(연면적·층수·층별 면적·주차·용도)으로 판정,
//     입력으로 알 수 없는 기준(입원실 있는 의원, 공연장 100㎡, 특수가연물 등)은 [확인 필요].
// ============================================================
import { num } from "./logic";

export const TEMP_REF = "소방시설법 제15조, 같은 법 시행령 제18조·[별표 8], 건설현장의 화재안전성능기준(NFPC 606)·기술기준(NFTC 606)";

export const T = { YES: "대상", NO: "비대상", CHK: "확인 필요", NA: "해당없음" };

/** 화재위험작업 — 시행령 제18조제1항 */
export const FIRE_WORKS = [
  "인화성·가연성·폭발성 물질을 취급하거나 가연성 가스를 발생시키는 작업",
  "용접·용단 등 불꽃을 발생시키거나 화기(火氣)를 취급하는 작업",
  "전열기구, 가열전선 등 열을 발생시키는 기구를 취급하는 작업",
  "알루미늄, 마그네슘 등을 취급하여 폭발성 부유분진을 발생시킬 수 있는 작업",
  "그 밖에 위와 비슷한 작업으로 소방청장이 고시하는 작업",
];

/** 시설별 설치기준 요약(NFPC 606) · 설치한 것으로 보는 소방시설(별표8 제3호) */
const SPEC = {
  ext: {
    name: "소화기",
    how: "각 층 계단실 출입구 부근에 능력단위 3단위 이상 2개 이상, 화재위험작업 시 작업지점 5m 이내에 3단위 이상 2개 이상 + 대형소화기 1개 이상 추가 (NFPC 606 제5조)",
  },
  simple: {
    name: "간이소화장치",
    how: "수원 20분 이상, 방수압력 0.1MPa·방수량 65L/min 이상, 화재위험작업 시 작업지점 25m 이내 배치 (NFPC 606 제6조)",
    alt: "옥내소화전설비, 또는 연결송수관설비 방수구 인근에 대형소화기 6개 이상 — 완공검사를 받아 사용할 수 있게 된 경우 (별표8 제3호가목, NFPC 606 제6조제5호)",
  },
  alarm: {
    name: "비상경보장치",
    how: "피난층 또는 지상으로 통하는 각 층 직통계단 출입구마다, 경종 1m에서 100dB 이상, 비상전원 20분 이상 (NFPC 606 제7조)",
    alt: "자동화재탐지설비 또는 비상방송설비 — 완공검사를 받아 사용할 수 있게 된 경우 (별표8 제3호나목)",
  },
  gas: {
    name: "가스누설경보기",
    how: "가연성가스 발생 작업 부분에서 수평거리 10m 이내, 바닥에서 탐지부 상단까지 0.3m 이하 (NFPC 606 제8조)",
  },
  guide: {
    name: "간이피난유도선",
    how: "해당 층 직통계단 출입구로부터 건물 안쪽으로 10m 이상, 바닥에서 1m 이하, 공사 중 상시 점등(녹색 계열), 비상전원 20분 이상 (NFPC 606 제9조)",
    alt: "피난유도선, 피난구유도등, 통로유도등 또는 비상조명등 — 완공검사를 받아 사용할 수 있게 된 경우 (별표8 제3호다목)",
  },
  light: {
    name: "비상조명등",
    how: "지하층·무창층에서 피난층 또는 지상으로 통하는 직통계단 계단실 각 층, 바닥 1lx 이상, 비상전원 20분(지하층·지상 11층 이상은 60분) 이상 (NFPC 606 제10조)",
  },
  blanket: {
    name: "방화포",
    how: "용접·용단 작업 시 11m 이내의 가연물을 방화포로 보호 (비산방지조치를 한 경우 제외, NFPC 606 제11조)",
  },
};

const fmt = (n) => Number(n).toLocaleString("ko-KR");
const lvName = (lv) => (lv < 0 ? `지하${-lv}층` : `${lv}층`);

/**
 * 층 기준 판정: 대상 층(pred) 중 바닥면적 min 이상이 있는가
 *  → { v: true | false | null, hit: [층 이름], unk: [면적 미입력 층] }
 */
function floorTest(floors, pred, min) {
  const cand = floors.filter(pred);
  const hit = cand.filter((f) => f.a !== null && f.a >= min).map((f) => lvName(f.lv) + (f.wl && f.lv > 0 ? "(무창층)" : ""));
  const unk = cand.filter((f) => f.a === null).map((f) => lvName(f.lv));
  return { v: hit.length ? true : unk.length ? null : false, hit, unk };
}

/** 신축 공사의 임시소방시설 설치 대상 */
export function tempFacilities(rv) {
  const u = rv.use;
  const g = (...ks) => ks.some((k) => u.g.includes(k));
  if (g("tunnel", "ugduct")) {
    return { status: T.NA, items: [], summary: "터널·지하구는 이 화면에서 판정하지 않습니다(공사 현장별 확인).", notes: [], ref: TEMP_REF };
  }
  const inp = rv.input;
  const area = num(inp.area) || 0;
  const gf = Math.max(0, parseInt(inp.gf, 10) || 0);
  const bf = Math.max(0, parseInt(inp.bf, 10) || 0);
  const given = new Map((inp.floors || []).map((f) => [f.level, f]));
  const floors = [];
  for (let i = bf; i >= 1; i--) floors.push(-i);
  for (let i = 1; i <= gf; i++) floors.push(i);
  const fl = floors.map((lv) => {
    const f = given.get(lv) || {};
    const a = num(f.area);
    return { lv, a: a && a > 0 ? a : null, wl: !!f.windowless };
  });
  const ugWl = (f) => f.lv < 0 || f.wl; // 지하층 또는 무창층
  const big = (f) => f.lv < 0 || f.wl || f.lv >= 4; // 지하층, 무창층, 4층 이상의 층

  const t150 = floorTest(fl, ugWl, 150);
  const t600 = floorTest(fl, big, 600);
  const items = [];
  const push = (key, status, why) => items.push({ key, ...SPEC[key], status, why });
  const fromTest = (t, min, label) =>
    t.v === true
      ? `${label} 중 바닥면적 ${fmt(min)}㎡ 이상인 층: ${t.hit.join(", ")}`
      : t.v === null
      ? `${label}의 바닥면적 미입력(${t.unk.join(", ")}) — ${fmt(min)}㎡ 이상이면 대상`
      : "";

  // 소화기 — 건축허가등 동의대상(시행령 제7조제1항) 공사
  const f = inp.f || {};
  const consent = [];
  if (area >= 400) consent.push(`연면적 ${fmt(area)}㎡(400㎡ 이상, 제1호)`);
  else if (g("noyu", "training") && area >= 200) consent.push(`노유자·수련시설 연면적 ${fmt(area)}㎡(200㎡ 이상, 제1호나목)`);
  else if (g("mental", "rehab") && area >= 300) consent.push(`정신의료기관·의료재활시설 연면적 ${fmt(area)}㎡(300㎡ 이상, 제1호다목·라목)`);
  else if (g("school") && area >= 100) consent.push(`학교시설 연면적 ${fmt(area)}㎡(100㎡ 이상, 제1호가목 — 학교시설사업 촉진법 적용 시)`);
  if (t150.v === true) consent.push(`${t150.hit.join(", ")} 바닥면적 150㎡ 이상(제2호)`);
  if (["ugParking", "parkingInside", "rooftopParking"].some((k) => Number(f[k]) > 0)) consent.push("차고·주차장 또는 주차 용도의 층(제3호)");
  if (Number(f.mechCars) > 0) consent.push("기계식 주차시설(제3호의2)");
  if (gf >= 6) consent.push(`지상 ${gf}층(6층 이상, 제4호)`);
  if (g("apt", "row", "multi", "dorm")) consent.push("공동주택(제6호)");
  if (g("lodging")) consent.push("숙박시설(제6호)");
  if (g("midwife")) consent.push("조산원·산후조리원(제6호)");
  if (g("hazmat")) consent.push("위험물 저장 및 처리 시설(제6호)");
  if (g("ess")) consent.push("전기저장시설(제6호)");
  if (g("noyu_res")) consent.push("노유자 생활시설(제7호 — 단독·공동주택 안의 시설 등 예외 확인)");
  if (g("nursing")) consent.push("요양병원(제8호)");
  push(
    "ext",
    consent.length ? T.YES : T.CHK,
    consent.length
      ? `건축허가등 동의대상(시행령 제7조제1항) — ${consent.join(" · ")}`
      : "건축허가등 동의대상(시행령 제7조제1항)이면 대상 — 입력값으로는 해당 기준을 찾지 못함(입원실·인공신장실 있는 의원, 공연장 지하·무창층 100㎡, 특수가연물 750배 등 확인)"
  );

  // 간이소화장치 — 연면적 3천㎡ 이상 / 지하층·무창층·4층 이상의 층 바닥면적 600㎡ 이상
  {
    const why = [];
    if (area >= 3000) why.push(`연면적 ${fmt(area)}㎡(3,000㎡ 이상)`);
    const w = fromTest(t600, 600, "지하층·무창층·4층 이상의 층");
    if (t600.v === true) why.push(w);
    const st = why.length ? T.YES : t600.v === null ? T.CHK : T.NO;
    push("simple", st, why.length ? why.join(" · ") : t600.v === null ? w : `연면적 3,000㎡ 미만이고 지하층·무창층·4층 이상의 층 중 600㎡ 이상인 층 없음`);
  }

  // 비상경보장치 — 연면적 400㎡ 이상 / 지하층·무창층 바닥면적 150㎡ 이상
  {
    const why = [];
    if (area >= 400) why.push(`연면적 ${fmt(area)}㎡(400㎡ 이상)`);
    const w = fromTest(t150, 150, "지하층·무창층");
    if (t150.v === true) why.push(w);
    const st = why.length ? T.YES : t150.v === null ? T.CHK : T.NO;
    push("alarm", st, why.length ? why.join(" · ") : t150.v === null ? w : "연면적 400㎡ 미만이고 지하층·무창층 중 150㎡ 이상인 층 없음");
  }

  // 가스누설경보기·간이피난유도선·비상조명등 — 바닥면적 150㎡ 이상인 지하층 또는 무창층
  for (const key of ["gas", "guide", "light"]) {
    const w = fromTest(t150, 150, "지하층·무창층");
    push(key, t150.v === true ? T.YES : t150.v === null ? T.CHK : T.NO, w || "바닥면적 150㎡ 이상인 지하층·무창층 없음");
  }

  // 방화포 — 용접·용단 작업이 진행되는 화재위험작업현장
  push("blanket", T.YES, "규모와 관계없이 용접·용단 작업을 하는 현장");

  const nY = items.filter((i) => i.status === T.YES).length;
  const nC = items.filter((i) => i.status === T.CHK).length;
  const status = nY ? T.YES : nC ? T.CHK : T.NO;
  const summary =
    `화재위험작업 현장에 설치할 임시소방시설 ${nY}종` +
    (nC ? `, 확인 필요 ${nC}종` : "") +
    " — 공사시공자가 화재위험작업 전에 설치·관리(법 제15조제1항)";
  const notes = [
    "층별 바닥면적과 무창층 여부를 입력하면 층 기준(150㎡·600㎡)까지 판정합니다. 무창층은 층별 입력의 「무창층」 표시를 따릅니다.",
    "설치한 것으로 보는 소방시설(별표8 제3호)은 해당 소방시설을 사용승인 전이라도 완공검사를 받아 사용할 수 있게 된 경우에 인정됩니다(NFPC 606 제6조~제9조).",
    "2026. 6. 23. 입법예고된 시행령 개정안(소방청공고 제2026-122호)은 간이소화장치를 설치한 것으로 보는 소방시설에 「살수장치」를 추가하는 내용입니다 — 공포·시행 여부 확인 필요.",
    "기존 건축물의 증축·개축·대수선·용도변경으로 설치가 현저히 곤란하면 소방본부장·소방서장이 일부 기준을 적용하지 않을 수 있습니다(NFPC 606 제13조).",
  ];
  return { status, items, summary, notes, works: FIRE_WORKS, ref: TEMP_REF };
}
