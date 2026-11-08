// ============================================================
// 착공 계산기 — 소방시설공사업법 시행령
//  · 제4조  착공신고 대상 (시행 2026.7.1. 기준 조문)
//  · 제10조 공사감리자 지정대상 (② 각 호)
//  · 별표2  소방기술자 배치기준 <개정 2025.1.21.>
//  · 별표3  소방공사 감리의 종류 <개정 2026.3.17.>
//  · 별표4  소방공사 감리원 배치기준 <개정 2019.12.10.>
// 판정은 '신설' 공사(신축) 기준. 증설·개설은 조문별 범위가 달라 별도 확인.
// ============================================================

/** 계산기에서 고르는 설비 — 분야: 별표2 비고 가(기계)·나(전기) */
export const CX_FACS = [
  { key: "hydrant", name: "옥내소화전설비(호스릴 포함)", field: "mech" },
  { key: "spk", name: "스프링클러설비(화재조기진압용 포함)", field: "mech" },
  { key: "sspk", name: "간이스프링클러설비", field: "mech" },
  { key: "water", name: "물분무등소화설비", field: "mech" },
  { key: "outhyd", name: "옥외소화전설비", field: "mech" },
  { key: "waterSupply", name: "상수도소화용수설비", field: "mech" },
  { key: "tank", name: "소화수조·저수조", field: "mech" },
  { key: "smoke", name: "제연설비", field: "mech" },
  { key: "standpipe", name: "연결송수관설비", field: "mech" },
  { key: "conspk", name: "연결살수설비", field: "mech" },
  { key: "spread", name: "연소방지설비", field: "mech" },
  { key: "alarm", name: "비상경보설비", field: "elec" },
  { key: "afd", name: "자동화재탐지설비", field: "elec" },
  { key: "notify", name: "화재알림설비", field: "elec" },
  { key: "pa", name: "비상방송설비", field: "elec" },
  { key: "outlet", name: "비상콘센트설비", field: "elec" },
  { key: "radio", name: "무선통신보조설비", field: "elec" },
  { key: "monitor", name: "통합감시시설", field: "" },
];
const NAME = Object.fromEntries(CX_FACS.map((f) => [f.key, f.name]));
export const CX_KEYS = CX_FACS.map((f) => f.key);

// 제4조제1호 가목·나목 — 신설 공사 착공신고 대상 설비
const REPORT_KEYS = ["hydrant", "spk", "sspk", "water", "outhyd", "waterSupply", "tank", "smoke", "standpipe", "conspk", "spread", "alarm", "afd", "notify", "pa", "outlet", "radio"];

// 제10조제2항 각 호 — 공사감리자 지정 대상 시공 (신설)
const SUPV_ITEMS = [
  { no: "제1호", keys: ["hydrant"], text: "옥내소화전설비 신설" },
  { no: "제2호", keys: ["spk", "sspk"], text: "스프링클러설비등(캐비닛형 간이스프링클러설비 제외) 신설" },
  { no: "제3호", keys: ["water"], text: "물분무등소화설비(호스릴 방식 제외) 신설" },
  { no: "제4호", keys: ["outhyd"], text: "옥외소화전설비 신설" },
  { no: "제5호", keys: ["afd"], text: "자동화재탐지설비 신설" },
  { no: "제5호의2", keys: ["notify"], text: "화재알림설비 신설" },
  { no: "제5호의3", keys: ["pa"], text: "비상방송설비 신설" },
  { no: "제6호", keys: ["monitor"], text: "통합감시시설 신설" },
  { no: "제7호", keys: ["waterSupply", "tank"], text: "소화용수설비 신설" },
  { no: "제8호가목", keys: ["smoke"], text: "제연설비 신설" },
  { no: "제8호나목", keys: ["standpipe"], text: "연결송수관설비 신설" },
  { no: "제8호다목", keys: ["conspk"], text: "연결살수설비 신설" },
  { no: "제8호라목", keys: ["outlet"], text: "비상콘센트설비 신설" },
  { no: "제8호마목", keys: ["radio"], text: "무선통신보조설비 신설" },
  { no: "제8호바목", keys: ["spread"], text: "연소방지설비 신설" },
];

export const TECH_GRADES = ["자격수첩 소방기술자", "초급기술자 이상", "중급기술자 이상", "고급기술자 이상", "특급기술자"];
export const SUPV_GRADES = ["", "초급감리원 이상", "중급감리원 이상", "고급감리원 이상", "특급감리원 이상", "특급감리원 중 소방기술사"];

const n = (v) => {
  const x = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(x) && String(v ?? "").trim() !== "" ? x : null;
};
const m2 = (x) => `${x.toLocaleString("ko-KR")}㎡`;

/**
 * @param {object} p { apt, ugduct, hazmat, area, gf, bf, households, facs:{key:true}, hoseReelOnly, cabinetOnly }
 */
export function construction(p) {
  const has = (k) => !!(p.facs && p.facs[k]);
  const area = n(p.area);
  const gf = n(p.gf) || 0;
  const bf = n(p.bf) || 0;
  const floors = gf + bf;
  const hh = n(p.households);
  const apt = !!p.apt;
  const ug = !!p.ugduct;
  const need = [];
  if (!ug && area === null) need.push("연면적");
  if (!ug && !gf) need.push("지상 층수");
  if (apt && hh === null) need.push("세대수");
  const picked = CX_KEYS.filter(has);
  if (need.length) return { ok: false, msg: `입력 필요: ${need.join(" · ")}`, need };
  const A = area || 0;
  const waterNR = has("water") && !p.hoseReelOnly; // 물분무등(호스릴 방식 제외)
  const smoke = has("smoke");

  // ---------- 착공신고 (영 제4조) ----------
  const repItems = REPORT_KEYS.filter(has).map((k) => NAME[k]);
  const report = p.hazmat
    ? { status: "제외", items: repItems, why: "위험물안전관리법에 따른 제조소등의 소방시설공사는 착공신고 대상에서 제외(영 제4조 각 호 외의 부분 단서)" }
    : repItems.length
      ? { status: "대상", items: repItems, why: "영 제4조제1호 가목·나목 설비를 신설하는 공사" }
      : { status: "비대상", items: [], why: picked.length ? "선택한 설비 중 영 제4조제1호 설비가 없음" : "신설하는 대상 설비가 없음" };

  // ---------- 소방기술자 (별표2) ----------
  const tl = [];
  const T = (lv, ref, why) => tl.push({ lv, ref, why });
  if (A >= 200000) T(4, "가목1)", `연면적 ${m2(A)} — 20만㎡ 이상`);
  if (!ug && floors >= 40) T(4, "가목2)", `지하층 포함 ${floors}층 — 40층 이상`);
  if (!apt && A >= 30000 && A < 200000) T(3, "나목1)", `연면적 ${m2(A)} — 3만㎡ 이상 20만㎡ 미만(아파트 제외)`);
  if (!ug && floors >= 16 && floors < 40) T(3, "나목2)", `지하층 포함 ${floors}층 — 16층 이상 40층 미만`);
  if (waterNR || smoke) T(2, "다목1)", [waterNR && "물분무등소화설비(호스릴 방식 제외)", smoke && "제연설비"].filter(Boolean).join("·") + " 설치");
  if (!apt && A >= 5000 && A < 30000) T(2, "다목2)", `연면적 ${m2(A)} — 5천㎡ 이상 3만㎡ 미만(아파트 제외)`);
  if (apt && A >= 10000 && A < 200000) T(2, "다목3)", `아파트 연면적 ${m2(A)} — 1만㎡ 이상 20만㎡ 미만`);
  if (!apt && !ug && A >= 1000 && A < 5000) T(1, "라목1)", `연면적 ${m2(A)} — 1천㎡ 이상 5천㎡ 미만(아파트 제외)`);
  if (apt && A >= 1000 && A < 10000) T(1, "라목2)", `아파트 연면적 ${m2(A)} — 1천㎡ 이상 1만㎡ 미만`);
  if (ug) T(1, "라목3)", "지하구 공사 현장");
  if (!ug && A < 1000) T(0, "마목", `연면적 ${m2(A)} — 1천㎡ 미만`);
  const tLv = Math.max(...tl.map((x) => x.lv));
  const mech = picked.some((k) => CX_FACS.find((f) => f.key === k).field === "mech");
  const elec = picked.some((k) => CX_FACS.find((f) => f.key === k).field === "elec");
  const fields = [mech && "기계분야", elec && "전기분야"].filter(Boolean);
  // 비고 마 — 중복 배치 제한
  const exclusive = (!apt && A >= 30000) || (apt && floors >= 16 && (hh || 0) >= 500);
  const site = exclusive
    ? `1개 공사 현장에만 배치(비고 마 단서 — ${apt ? "16층 이상·500세대 이상 아파트" : "연면적 3만㎡ 이상(아파트 제외)"})`
    : A < 5000
      ? "2개 현장까지 배치 가능. 연면적 5천㎡ 미만 현장에만 배치하면 2개 초과 가능(연면적 합계 2만㎡ 이하) — 비고 마1)"
      : "2개 현장까지 배치 가능. 5천㎡ 이상 현장 2개 이하 + 5천㎡ 미만 현장(합계 1만㎡ 이하)은 함께 배치 가능 — 비고 마2)";
  const tech = {
    lv: tLv,
    grade: TECH_GRADES[tLv],
    fields,
    reasons: tl.sort((a, b) => b.lv - a.lv),
    site,
    exclusive,
    none: !fields.length,
  };

  // ---------- 공사감리 (영 제10조, 별표3·4) ----------
  const supvItems = SUPV_ITEMS.filter((it) =>
    it.keys.some((k) => {
      if (!has(k)) return false;
      if (k === "water" && p.hoseReelOnly) return false;
      if (k === "sspk" && p.cabinetOnly) return false;
      return true;
    }),
  );
  let supv;
  if (!supvItems.length) {
    supv = { status: "비대상", items: [], why: picked.length ? "영 제10조제2항 각 호의 시공에 해당하는 설비가 없음" : "신설하는 대상 설비가 없음" };
  } else {
    const resident = (!apt && A >= 30000) || (apt && floors >= 16 && (hh || 0) >= 500);
    const kindWhy = resident
      ? apt
        ? `지하층 포함 ${floors}층·${hh}세대 — 16층 이상으로서 500세대 이상 아파트(별표3 상주 제2호)`
        : `연면적 ${m2(A)} — 3만㎡ 이상(아파트 제외)(별표3 상주 제1호)`
      : "상주 공사감리 대상(연면적 3만㎡ 이상 또는 16층 이상·500세대 이상 아파트)에 해당하지 않음";
    const sl = [];
    const L = (lv, ref, why, assist) => sl.push({ lv, ref, why, assist });
    if (A >= 200000) L(5, "가목1)", `연면적 ${m2(A)} — 20만㎡ 이상`, true);
    if (!ug && floors >= 40) L(5, "가목2)", `지하층 포함 ${floors}층 — 40층 이상`, true);
    if (!apt && A >= 30000 && A < 200000) L(4, "나목1)", `연면적 ${m2(A)} — 3만㎡ 이상 20만㎡ 미만(아파트 제외)`, true);
    if (!ug && floors >= 16 && floors < 40) L(4, "나목2)", `지하층 포함 ${floors}층 — 16층 이상 40층 미만`, true);
    if (waterNR || smoke) L(3, "다목1)", [waterNR && "물분무등소화설비(호스릴 방식 제외)", smoke && "제연설비"].filter(Boolean).join("·") + " 설치", true);
    if (apt && A >= 30000 && A < 200000) L(3, "다목2)", `아파트 연면적 ${m2(A)} — 3만㎡ 이상 20만㎡ 미만`, true);
    if (A >= 5000 && A < 30000) L(2, "라목", `연면적 ${m2(A)} — 5천㎡ 이상 3만㎡ 미만`, false);
    if (!ug && A < 5000) L(1, "마목1)", `연면적 ${m2(A)} — 5천㎡ 미만`, false);
    if (ug) L(1, "마목2)", "지하구 공사 현장", false);
    const lv = Math.max(...sl.map((x) => x.lv));
    const top = sl.filter((x) => x.lv === lv);
    const assistReq = top.some((x) => x.assist);
    const extra = A > 200000 ? Math.ceil((A - 200000) / 100000) : 0;
    let assist;
    if (!assistReq) assist = { need: "없음", text: "보조감리원 배치기준 없음(별표4 라·마목)" };
    else if (resident) assist = { need: "필요", text: `초급감리원 이상(기계분야 및 전기분야)${extra ? ` + 추가 ${extra}명 이상(비고 다 — 20만㎡ 초과분 10만㎡마다 1명)` : ""}` };
    else assist = { need: "생략 가능", text: "초급감리원 이상(기계분야 및 전기분야) — 일반 공사감리는 보조감리원을 배치하지 않을 수 있음(비고 라)" };
    supv = {
      status: "대상",
      items: supvItems,
      kind: resident ? "상주 공사감리" : "일반 공사감리",
      kindWhy,
      lv,
      chief: `${SUPV_GRADES[lv]}(기계분야 및 전기분야)`,
      assist,
      extra,
      reasons: sl.sort((a, b) => b.lv - a.lv),
      method: resident
        ? "공사 현장에 상주하며 감리업무 수행·감리일지 기록, 1일 이상 현장 이탈 시 업무대행자 지정(별표3)"
        : "주 1회 이상 공사 현장에 배치되어 감리업무 수행·감리일지 기록, 14일 이내 부득이한 사유 시 업무대행자(주 2회 이상) 지정(별표3)",
    };
  }

  // ---------- 참고·확인 ----------
  const notes = [];
  if (tech.lv >= 0 && fields.length === 2) notes.push("기계·전기분야 자격을 모두 갖춘 소방기술자 1명으로 분야 구분 없이 배치 가능(별표2 비고 다)");
  if (has("monitor") && !fields.length) notes.push("통합감시시설은 별표2 비고 가·나의 분야 구분 설비에 열거되어 있지 않음 — 배치 분야 확인 필요");
  if (supv.status === "대상") {
    const omit = [];
    omit.push("비상전원을 전기공사업자가 공사");
    if (has("waterSupply") || has("tank")) omit.push("소화용수설비를 기계설비·가스공사업자 또는 상·하수도설비공사업자가 공사");
    if (smoke) omit.push("소방 겸용 제연설비를 기계설비·가스공사업자가 공사");
    if (has("pa") || has("radio")) omit.push("소방 겸용 비상방송·무선통신보조설비를 정보통신공사업자가 공사");
    notes.push(`감리 대상 공사 중 다음은 해당 공사에 소방기술자를 배치하지 않을 수 있음(별표2 비고 라): ${omit.join(" / ")}`);
  }
  if (report.status === "대상") {
    const ex = [];
    if (has("waterSupply") || has("tank")) ex.push("소화용수설비를 기계설비·가스공사업자 또는 상·하수도설비공사업자가 공사");
    if (smoke) ex.push("소방 겸용 제연설비를 기계설비·가스공사업자가 공사");
    if (has("pa") || has("radio")) ex.push("소방 겸용 비상방송·무선통신보조설비를 정보통신공사업자가 공사");
    if (has("outlet")) ex.push("비상콘센트설비를 전기공사업자가 공사");
    if (ex.length) notes.push(`착공신고 대상에서 빠지는 시공 주체: ${ex.join(" / ")} (영 제4조제1호)`);
  }
  if (p.mixedRes) notes.push("주택 겸용 복합건축물은 '아파트' 기준 적용 여부를 확인하세요(현재 아파트 여부 선택값으로 산정)");
  if (p.hazmat) notes.push("위험물 제조소등은 위험물안전관리법 절차(완공검사 등) 확인 — 소방공사감리 지정 여부 확인 필요");
  if (p.hoseReelOnly && has("water")) notes.push("물분무등소화설비가 호스릴 방식뿐이면 중급기술자 기준(별표2 다목1)·고급감리원 기준(별표4 다목1)·감리 제3호에서 제외");
  if (p.cabinetOnly && has("sspk")) notes.push("캐비닛형 간이스프링클러설비는 감리 지정 제2호에서 제외(착공신고 대상에는 포함)");
  notes.push("하나의 공사 현장 기준(동별이 아닌 현장 연면적 합계·최고 층수)으로 입력하세요. 2개 이상 기준에 해당하면 상위 등급 1명으로 갈음 가능(별표2 비고 바·별표4 비고 마)");
  notes.push("배치기간: 착공일부터 소방시설 완공검사증명서 발급일까지(감리원은 행정안전부령으로 정하는 기간) — 공사 중단 시 발주자 서면 승낙으로 미배치 가능");

  return { ok: true, area: A, floors, apt, ug, picked, report, tech, supv, notes };
}

/** 신축 산정 결과(설치 목록 키) → 계산기 설비 선택값 */
export function facsFromKeys(keys) {
  const s = new Set(keys || []);
  const out = {};
  for (const k of CX_KEYS) if (s.has(k)) out[k] = true;
  return out;
}
