// ============================================================
// 점검인력 배치·점검일수 산정 — 소방시설법 시행규칙 [별표4] <개정 2024.11.29.>
//  제1호 점검인력 1단위, 제2호 규모별 배치기준(관리업자), 제3·4호 점검한도 면적,
//  제6호 점검면적(가감계수·미설치 감산), 제7호 아파트등 세대수, 제8호 아파트등+그 외 환산, 제10호 반올림
//  ※ 하루에 2개 이상 대상물 배치(제4호 단서·제5호·제6호다목·제7호다목2))와 종합+작동 같은 날 점검(제9호)은 산정하지 않음
// ============================================================

/** 제10호 — 소수점 이하 둘째 자리에서 반올림 */
export const r1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

/** 제6호가목 가감계수 */
export const ST_CLASSES = {
  1: { coef: 1.1, uses: "문화 및 집회시설, 종교시설, 판매시설, 의료시설, 노유자시설, 수련시설, 숙박시설, 위락시설, 창고시설, 교정시설, 발전시설, 지하가, 복합건축물" },
  2: { coef: 1.0, uses: "공동주택, 근린생활시설, 운수시설, 교육연구시설, 운동시설, 업무시설, 방송통신시설, 공장, 항공기 및 자동차 관련 시설, 군사시설, 관광휴게시설, 장례시설, 지하구" },
  3: { coef: 0.9, uses: "위험물 저장 및 처리시설, 문화재, 동물 및 식물 관련 시설, 자원순환 관련 시설, 묘지 관련 시설" },
};

/** 용도 문구로 류 추정(사용자가 바꿀 수 있음) */
export function guessClass(useLabel) {
  const u = String(useLabel || "");
  if (/복합건축물|문화 및 집회|종교|판매|의료|노유자|수련|숙박|위락|창고|교정|발전|지하가/.test(u)) return "1";
  if (/위험물|문화재|국가유산|동물 및 식물|자원순환|묘지/.test(u)) return "3";
  return "2";
}

/** 제1호 — 점검인력 1단위와 추가 가능한 보조 점검인력 */
export function unitRule(checker, sameBldg = true) {
  if (checker === "mgmt") return { base: "특급점검자 1명 + 보조 점검인력(영 별표9 주된·보조 기술인력) 2명", maxExtra: sameBldg ? 4 : 2, ref: "제1호가목", extraNote: "보조 점검인력 2명(같은 건축물을 점검할 때는 4명) 이내 추가" };
  if (checker === "manager") return { base: "소방시설관리사 또는 소방기술사 1명 + 보조 점검인력 2명", maxExtra: 2, ref: "제1호나목", extraNote: "보조 점검인력 2명 이내 추가" };
  return { base: "관계인 1명 + 보조 점검인력 2명", maxExtra: 0, ref: "제1호다목", extraNote: "추가 규정 없음" };
}

/** 제2호 — 관리업자 점검 시 규모별 배치기준. need: 보조 점검인력 최소 등급 목록(1 초급 ~ 3 고급) */
export const SCALE_RULES = {
  a: { label: "50층 이상 또는 성능위주설계를 한 특정소방대상물", main: "소방시설관리사 경력 5년 이상 1명 이상", mainAlt: "특급점검자", assist: "고급점검자 이상 1명 이상 및 중급점검자 이상 1명 이상", need: [3, 2], ref: "제2호가목" },
  b: { label: "특급 소방안전관리대상물(가목 제외)", main: "소방시설관리사 경력 3년 이상 1명 이상", mainAlt: "특급점검자", assist: "고급점검자 이상 1명 이상 및 초급점검자 이상 1명 이상", need: [3, 1], ref: "제2호나목" },
  c: { label: "1급 또는 2급 소방안전관리대상물", main: "소방시설관리사 경력 1년 이상 1명 이상", mainAlt: "특급점검자", assist: "중급점검자 이상 1명 이상 및 초급점검자 이상 1명 이상", need: [2, 1], ref: "제2호다목" },
  d: { label: "3급 소방안전관리대상물", main: "특급점검자 1명 이상", mainAlt: "", assist: "초급점검자 이상 2명 이상", need: [1, 1], ref: "제2호라목" },
};
export function scaleOf(grade, big) {
  if (big) return "a";
  if (grade === "특급") return "b";
  if (grade === "1급" || grade === "2급") return "c";
  if (grade === "3급") return "d";
  return "";
}
const RANK = { 초급점검자: 1, 중급점검자: 2, 고급점검자: 3, 특급점검자: 4, 소방시설관리사: 5, 소방기술사: 5 };

/** 보조 점검인력 등급 충족 여부(경력 연수는 확인 불가) */
export function checkAssist(scale, quals) {
  const rule = SCALE_RULES[scale];
  if (!rule) return null;
  const ranks = quals.map((q) => RANK[q] || 0).sort((a, b) => b - a);
  const need = [...rule.need].sort((a, b) => b - a);
  const ok = need.every((n, i) => (ranks[i] || 0) >= n);
  return { ok, text: ok ? `보조 점검인력 등급 충족(${rule.assist})` : `보조 점검인력 등급 부족 — ${rule.assist} 필요(${rule.ref})` };
}

/**
 * 점검일수 산정(대상물 1개, 하루 1개 대상물 기준)
 * p: { comp, checker, extra, mode('bldg'|'apt'|'mixed'|'ug'|'tunnel'), cls, area, len, lanes, oneSide, hh, noSpk, noWater, noSmoke }
 */
export function staffing(p) {
  const num = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
  const comp = !!p.comp;
  const rule = unitRule(p.checker, true);
  const extra = Math.max(0, Math.min(rule.maxExtra, Math.floor(num(p.extra) || 0)));
  const steps = [];
  const limitA = comp ? 8000 + 2000 * extra : 10000 + 2500 * extra;
  const limitH = 250 + 60 * extra;
  const mode = p.mode || "bldg";
  const ded = [p.noSpk && "스프링클러설비", p.noWater && "물분무등소화설비(호스릴 제외)", p.noSmoke && "제연설비"].filter(Boolean);
  const out = { ok: false, comp, extra, maxExtra: rule.maxExtra, rule, limitA, limitH, steps, mode };

  // 면적 부분(제6호)
  let areaPts = null;
  if (mode !== "apt") {
    let actual;
    if (mode === "ug") {
      const L = num(p.len);
      if (L === null) return { ...out, msg: "지하구 길이 입력 필요" };
      actual = r1(L * 1.8);
      steps.push(`실제 점검면적 = 지하구 길이 ${L}m × 폭 1.8m = ${actual.toLocaleString("ko-KR")}㎡ (제6호)`);
    } else if (mode === "tunnel") {
      const L = num(p.len);
      if (L === null) return { ...out, msg: "터널 길이 입력 필요" };
      const w = Number(p.lanes) >= 4 && !p.oneSide ? 7 : 3.5;
      actual = r1(L * w);
      steps.push(`실제 점검면적 = 터널 길이 ${L}m × 폭 ${w}m${Number(p.lanes) >= 4 ? (p.oneSide ? "(4차로 이상·한쪽 측벽 설치)" : "(4차로 이상)") : "(3차로 이하)"} = ${actual.toLocaleString("ko-KR")}㎡ (제6호)`);
    } else {
      actual = num(p.area);
      if (actual === null) return { ...out, msg: mode === "mixed" ? "아파트등 외 부분 연면적 입력 필요" : "실제 점검면적(연면적) 입력 필요" };
    }
    const cls = ST_CLASSES[p.cls] ? p.cls : "2";
    const coef = ST_CLASSES[cls].coef;
    const a1 = r1(actual * coef);
    steps.push(`가감계수 적용: ${actual.toLocaleString("ko-KR")}㎡ × ${coef.toFixed(1)}(${cls}류) = ${a1.toLocaleString("ko-KR")}㎡ (제6호가목)`);
    const d = r1(a1 * 0.1 * ded.length);
    if (ded.length) steps.push(`미설치 감산: ${a1.toLocaleString("ko-KR")} × 0.1 × ${ded.length}(${ded.join("·")} 미설치) = ${d.toLocaleString("ko-KR")}㎡ (제6호나목)`);
    areaPts = r1(a1 - d);
    steps.push(`${mode === "mixed" ? "아파트등 외 부분 " : ""}점검면적 = ${areaPts.toLocaleString("ko-KR")}㎡`);
  }

  // 세대수 부분(제7호)
  let hhPts = null;
  if (mode === "apt" || mode === "mixed") {
    const hh = num(p.hh);
    if (hh === null) return { ...out, msg: "실제 점검 세대수 입력 필요" };
    const d = r1(hh * 0.1 * ded.length);
    hhPts = r1(hh - d);
    steps.push(`점검세대수 = ${hh.toLocaleString("ko-KR")}세대${ded.length ? ` − ${hh} × 0.1 × ${ded.length}(${ded.join("·")} 미설치) = ${hhPts.toLocaleString("ko-KR")}세대` : ""} (제7호다목)`);
  }

  let ratio;
  let basis;
  if (mode === "apt") {
    steps.push(`점검한도 세대수 = 250세대${extra ? ` + 60 × ${extra}명 = ${limitH}세대` : ""} (제7호가·나목)`);
    ratio = r1(hhPts / limitH);
    steps.push(`${hhPts.toLocaleString("ko-KR")} ÷ ${limitH} = ${ratio}`);
    basis = `${hhPts.toLocaleString("ko-KR")}세대 / 1일 한도 ${limitH}세대`;
  } else {
    let total = areaPts;
    if (mode === "mixed") {
      const conv = r1(hhPts * (comp ? 32 : 40));
      total = r1(conv + areaPts);
      steps.push(`아파트등 환산 연면적 = ${hhPts.toLocaleString("ko-KR")}세대 × ${comp ? 32 : 40} = ${conv.toLocaleString("ko-KR")}㎡ → 점검대상 연면적 ${conv.toLocaleString("ko-KR")} + ${areaPts.toLocaleString("ko-KR")} = ${total.toLocaleString("ko-KR")}㎡ (제8호)`);
    }
    steps.push(`점검한도 면적 = ${comp ? "종합점검 8,000" : "작동점검 10,000"}㎡${extra ? ` + ${comp ? "2,000" : "2,500"} × ${extra}명 = ${limitA.toLocaleString("ko-KR")}㎡` : ""} (제3·4호)`);
    ratio = r1(total / limitA);
    steps.push(`${total.toLocaleString("ko-KR")} ÷ ${limitA.toLocaleString("ko-KR")} = ${ratio}`);
    basis = `${total.toLocaleString("ko-KR")}㎡ / 1일 한도 ${limitA.toLocaleString("ko-KR")}㎡`;
  }
  const days = Math.max(1, Math.ceil(ratio - 1e-9));
  return { ...out, ok: true, areaPts, hhPts, ratio, days, basis, staff: 3 + extra };
}
