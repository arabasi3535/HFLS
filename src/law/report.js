// ============================================================
// 관계인 작동점검 보고서 — 서식 행 정의·소방시설 매핑·기본값
//  · 보고서: 소방시설법 시행규칙 [별지 제9호서식] 소방시설등 자체점검 실시결과 보고서 <개정 2025.12.1.>
//  · 이행계획서: 같은 규칙 [별지 제10호서식]
//  · 점검번호·점검항목: 소방시설 자체점검사항 등에 관한 고시 [별지 제4호서식] 점검표 중 작동점검(○) 항목
// ============================================================
import { CL_ITEMS } from "./checklist";
import { CL_ITEMS_C } from "./checklistComp";

/**
 * 자체점검 보고서 종류 — 시행규칙 [별지 제9호서식] 첫머리 구분, 별표3 점검자 자격
 *  owner: 관계인 작동점검(3급), mgmt: 관리업 작동점검, compFirst: 종합점검(최초점검), comp: 그 밖의 종합점검
 */
export const VARIANTS = {
  owner: { id: "owner", tab: "작동점검(관계인)", title: "관계인 작동점검 보고서", comp: false, first: false, store: "hfls_report_v1", checker: "owner", file: "작동점검(관계인)" },
  mgmt: { id: "mgmt", tab: "작동점검(관리업)", title: "작동점검 보고서(소방시설관리업자 등)", comp: false, first: false, store: "hfls_report_mgmt_v1", checker: "mgmt", file: "작동점검(관리업)" },
  compFirst: { id: "compFirst", tab: "종합점검(최초점검)", title: "종합점검 보고서 — 최초점검", comp: true, first: true, store: "hfls_report_compf_v1", checker: "mgmt", file: "종합점검(최초)" },
  comp: { id: "comp", tab: "종합점검(그 밖의 종합점검)", title: "종합점검 보고서 — 그 밖의 종합점검", comp: true, first: false, store: "hfls_report_comp_v1", checker: "mgmt", file: "종합점검" },
};
export const QUALS_OWNER = ["관계인", "소방안전관리자", "소방안전관리보조자", "직원"];
export const QUALS_PRO = ["소방시설관리사", "특급점검자", "고급점검자", "중급점검자", "초급점검자", "소방기술사"];

/**
 * 주된 점검인력 자격 확인 — 시행규칙 별표3 제1호다목·제2호다목
 *  작동점검(관리업): 관리업에 등록된 소방시설관리사·특급점검자 / 소방안전관리자로 선임된 관리사·기술사
 *  종합점검: 관리업에 등록된 소방시설관리사 / 소방안전관리자로 선임된 관리사·기술사
 */
export function mainQualWarn(rep) {
  const q = ((rep.inspectors && rep.inspectors[0]) || {}).qual || "";
  const v = VARIANTS[rep.kind] || VARIANTS.owner;
  if (v.id === "owner") return "";
  const ok = rep.checker === "manager" ? ["소방시설관리사", "소방기술사"] : v.comp ? ["소방시설관리사"] : ["소방시설관리사", "특급점검자"];
  if (!q || ok.includes(q)) return "";
  return `${v.comp ? "종합점검" : "작동점검"}의 주된 점검인력은 ${rep.checker === "manager" ? "소방안전관리자로 선임된 소방시설관리사·소방기술사" : `관리업에 등록된 ${ok.join("·")}`}이어야 합니다(시행규칙 별표3).`;
}

/**
 * 제3쪽 「1. 소방시설등 점검 결과」 행
 *  fac: 결과 화면 소방시설 키(설치 대상이면 자동 체크), cl: 점검표 범위(점검번호 앞부분 또는 [섹션, 세부구분])
 *  group: 하위 행이 있는 묶음 행(결과는 하위 행에서 자동 계산)
 */
export const ROWS_L = [
  { id: "g_ext", cat: "소화설비", label: "소화기구 및 자동소화장치", group: ["ext", "auto_res", "auto_com", "auto_cab", "auto_gas"] },
  { id: "ext", cat: "소화설비", label: "소화기구(소화기, 자확, 간이)", sub: true, fac: ["ext"], cl: ["1-A"] },
  { id: "auto_res", cat: "소화설비", label: "주거용주방자동소화장치", sub: true, cl: [["1-B", "주거용 주방 자동소화장치"]] },
  { id: "auto_com", cat: "소화설비", label: "상업용주방자동소화장치", sub: true, cl: [["1-B", "상업용 주방 자동소화장치"]] },
  { id: "auto_cab", cat: "소화설비", label: "캐비닛형자동소화장치", sub: true, cl: [["1-B", "캐비닛형 자동소화장치"]] },
  { id: "auto_gas", cat: "소화설비", label: "가스ㆍ분말ㆍ고체자동소화장치", sub: true, cl: [["1-B", "가스·분말·고체에어로졸 자동소화장치"]] },
  { id: "hydrant", cat: "소화설비", label: "옥내소화전설비", fac: ["hydrant"], cl: ["2-"] },
  { id: "spk", cat: "소화설비", label: "스프링클러설비", fac: ["spk"], cl: ["3-"] },
  { id: "sspk", cat: "소화설비", label: "간이스프링클러설비", fac: ["sspk"], cl: ["4-"] },
  { id: "esfr", cat: "소화설비", label: "화재조기진압용스프링클러설비", cl: ["5-"] },
  { id: "w_spray", cat: "소화설비", label: "물분무소화설비", cl: ["6-"] },
  { id: "w_mist", cat: "소화설비", label: "미분무소화설비", cl: ["7-"] },
  { id: "w_foam", cat: "소화설비", label: "포소화설비", cl: ["8-"] },
  { id: "w_co2", cat: "소화설비", label: "이산화탄소소화설비", cl: ["9-"] },
  { id: "w_halon", cat: "소화설비", label: "할론소화설비", cl: ["10-"] },
  { id: "w_clean", cat: "소화설비", label: "할로겐화합물 및 불활성기체 소화설비", cl: ["11-"] },
  { id: "w_powder", cat: "소화설비", label: "분말소화설비", cl: ["12-"] },
  { id: "w_liquid", cat: "소화설비", label: "강화액소화설비", cl: [] },
  { id: "w_aerosol", cat: "소화설비", label: "고체에어로졸소화설비", cl: [] },
  { id: "outhyd", cat: "소화설비", label: "옥외소화전설비", fac: ["outhyd"], cl: ["13-"] },
  { id: "single", cat: "경보설비", label: "단독경보형감지기", fac: ["single"], cl: ["14-B"] },
  { id: "alarm", cat: "경보설비", label: "비상경보설비", fac: ["alarm"], cl: ["14-A"] },
  { id: "afd", cat: "경보설비", label: "자동화재탐지설비 및 시각경보기", fac: ["afd", "visual"], cl: ["15-"] },
  { id: "notify", cat: "경보설비", label: "화재알림설비", fac: ["notify"], cl: [] },
  { id: "pa", cat: "경보설비", label: "비상방송설비", fac: ["pa"], cl: ["16-"] },
  { id: "monitor", cat: "경보설비", label: "통합감시시설", fac: ["monitor"], cl: ["17-B"] },
  { id: "report", cat: "경보설비", label: "자동화재속보설비", fac: ["report"], cl: ["17-A"] },
  { id: "leak", cat: "경보설비", label: "누전경보기", fac: ["leak"], cl: ["18-"] },
  { id: "gasleak", cat: "경보설비", label: "가스누설경보기", fac: ["gasleak"], cl: ["19-"] },
];
export const ROWS_R = [
  { id: "g_esc", cat: "피난구조설비", label: "피난기구", group: ["esc_a", "esc_b", "esc_c"] },
  { id: "esc_a", cat: "피난구조설비", label: "공기안전매트ㆍ피난사다리ㆍ(간이)완강기ㆍ미끄럼대ㆍ구조대", sub: true, fac: ["escape"], cl: ["20-A"] },
  { id: "esc_b", cat: "피난구조설비", label: "다수인피난장비", sub: true, cl: ["20-A"] },
  { id: "esc_c", cat: "피난구조설비", label: "승강식피난기ㆍ하향식피난구용내림식사다리", sub: true, cl: ["20-A"] },
  { id: "rescue", cat: "피난구조설비", label: "인명구조기구", fac: ["rescue"], cl: ["20-E"] },
  { id: "guide", cat: "피난구조설비", label: "유도등", fac: ["guide", "seatguide"], cl: ["21-A"] },
  { id: "sign", cat: "피난구조설비", label: "유도표지", fac: ["guide"], cl: ["21-B"] },
  { id: "line", cat: "피난구조설비", label: "피난유도선", cl: ["21-C"] },
  { id: "elight", cat: "피난구조설비", label: "비상조명등", fac: ["elight"], cl: ["22-A"] },
  { id: "plight", cat: "피난구조설비", label: "휴대용비상조명등", fac: ["plight"], cl: ["22-B"] },
  { id: "ws_city", cat: "소화용수설비", label: "상수도소화용수설비", fac: ["waterSupply"], cl: ["23-B"] },
  { id: "ws_tank", cat: "소화용수설비", label: "소화수조 및 저수조", cl: ["23-A"] },
  { id: "smoke", cat: "소화활동설비", label: "거실제연설비", fac: ["smoke"], cl: ["24-"] },
  { id: "smoke2", cat: "소화활동설비", label: "부속실 등 제연설비", cl: ["25-"] },
  { id: "standpipe", cat: "소화활동설비", label: "연결송수관설비", fac: ["standpipe"], cl: ["26-"] },
  { id: "conspk", cat: "소화활동설비", label: "연결살수설비", fac: ["conspk"], cl: ["27-"] },
  { id: "outlet", cat: "소화활동설비", label: "비상콘센트설비", fac: ["outlet"], cl: ["28-"] },
  { id: "radio", cat: "소화활동설비", label: "무선통신보조설비", fac: ["radio"], cl: ["29-"] },
  { id: "spread", cat: "소화활동설비", label: "연소방지설비", fac: ["spread"], cl: ["30-"] },
  { id: "door", cat: "기타", label: "방화문, 자동방화셔터", cl: ["31-A"] },
  { id: "exit", cat: "기타", label: "비상구, 피난통로", cl: [] },
  { id: "flame", cat: "기타", label: "방 염", cl: [] },
];
/** 제3쪽 「2. 안전시설등 점검 결과(다중이용업소)」 */
export const ROWS_M_L = [
  { id: "m_ext", cat: "소화설비", label: "소화기 또는 자동확산소화기", cl: [["32-A", null, ["32-A-001", "32-A-002", "32-A-003", "32-A-004", "32-A-005"]]] },
  { id: "m_sspk", cat: "소화설비", label: "간이스프링클러설비", cl: [["32-A", null, ["32-A-011", "32-A-012", "32-A-013", "32-A-014"]]] },
  { id: "m_alarm", cat: "경보설비", label: "비상경보설비 또는 자동화재탐지설비", cl: [["32-B", null, ["32-B-001", "32-B-002", "32-B-003"]]] },
  { id: "m_gas", cat: "경보설비", label: "가스누설경보기", cl: [] },
  { id: "m_esc", cat: "피난구조설비", label: "피난기구", cl: [["32-C", null, ["32-C-002", "32-C-003", "32-C-004"]]] },
  { id: "m_line", cat: "피난구조설비", label: "피난유도선", cl: [["32-C", null, ["32-C-011"]]] },
  { id: "m_guide", cat: "피난구조설비", label: "유도등, 유도표지 또는 비상조명등", cl: [["32-C", null, ["32-C-021", "32-C-022", "32-C-023", "32-C-031", "32-C-032", "32-C-041"]]] },
  { id: "m_plight", cat: "피난구조설비", label: "휴대용비상조명등", cl: [["32-C", null, ["32-C-051"]]] },
];
export const ROWS_M_R = [
  { id: "m_door", cat: "비상구", label: "방화문", cl: [["32-D", null, ["32-D-003"]]] },
  { id: "m_exit", cat: "비상구", label: "비상구(비상탈출구)", cl: [["32-D", null, ["32-D-001", "32-D-002"]]] },
  { id: "m_path", cat: "기타", label: "영업장 내부 피난통로", cl: [["32-E", null, ["32-E-001"]]] },
  { id: "m_av", cat: "기타", label: "영상음향차단장치", cl: [] },
  { id: "m_elcb", cat: "기타", label: "누전차단기", cl: [] },
  { id: "m_win", cat: "기타", label: "창 문", cl: [["32-E", null, ["32-E-004"]]] },
  { id: "m_map", cat: "기타", label: "피난안내도, 피난안내영상물", cl: [["32-F", null, ["32-F-001"]]] },
  { id: "m_flame", cat: "기타", label: "방염대상물품", cl: [] },
];
export const ALL_ROWS = [...ROWS_L, ...ROWS_R];
export const M_ROWS = [...ROWS_M_L, ...ROWS_M_R];

/** 불량 세부 사항(제8쪽) 설비 구분 */
export const DEFECT_CATS = ["소화설비", "경보설비", "피난구조설비", "소화용수설비", "소화활동설비", "기타", "안전시설등"];

/** 행의 작동점검 항목 목록 [{code, unit, head, text}] */
export function rowItems(row, comp = false) {
  const out = [];
  for (const c of row.cl || []) {
    const [prefix, head, codes] = Array.isArray(c) ? c : [c, null, null];
    const top = prefix.split("-")[0];
    const src = [...(CL_ITEMS[top] || []).map((x) => [...x, "○"]), ...(comp ? (CL_ITEMS_C[top] || []).map((x) => [...x, "●"]) : [])];
    for (const [code, unit, h, text, k] of src) {
      if (!code.startsWith(prefix.endsWith("-") ? prefix : prefix + "-") && code !== prefix) continue;
      if (head && h !== head) continue;
      if (codes && !codes.includes(code)) continue;
      out.push({ code, unit, head: h, text, k });
    }
  }
  if (comp) out.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));
  return out;
}

/** 점검항목 → 불량내용 기본 문구 */
export function defectText(text) {
  const t = text
    .replace(/\s*(적정|적합|정상)?\s*(여부|유무)$/, "")
    .replace(/(의|이|가)$/, "")
    .trim();
  return `${t} 불량`;
}

/**
 * 소재지 → 관할 소방서(경상북도 22개 소방서만 자동)
 *  · 시·군마다 소방서 1곳, 포항시만 남구(포항남부)·북구(포항북부)로 나뉨, 울릉군은 소방서가 없어 포항남부 관할
 *  · 군위군은 2023.7.1. 대구광역시로 편입 — 경북 밖 주소와 같이 직접 입력
 *  출처: 경상북도소방본부 소방서현황(관할구역), 관리자 확인(2026.11.)
 */
const GB_CITY = ["경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산"];
const GB_GUN = ["의성", "청송", "영양", "영덕", "청도", "고령", "성주", "칠곡", "예천", "봉화", "울진"];
export function stationInfo(addr) {
  const a = (addr || "").replace(/\s+/g, " ");
  if (!a.trim()) return { station: "", note: "" };
  if (/포항/.test(a)) {
    if (/남구/.test(a)) return { station: "포항남부소방서장", note: "포항시 남구" };
    if (/북구/.test(a)) return { station: "포항북부소방서장", note: "포항시 북구" };
    return { station: "", note: "포항시는 남구(포항남부소방서)·북구(포항북부소방서)를 주소에 적어 주십시오." };
  }
  if (/울릉/.test(a)) return { station: "포항남부소방서장", note: "울릉군은 포항남부소방서 관할(울릉119안전센터) — 울릉소방서 개서 후에는 바꿔 적으십시오." };
  for (const c of GB_CITY) if (new RegExp(`${c}(시|\\s|$)`).test(a)) return { station: `${c}소방서장`, note: `${c}시` };
  for (const g of GB_GUN) if (new RegExp(`${g}(군|\\s|$)`).test(a)) return { station: `${g}소방서장`, note: `${g}군` };
  return { station: "", note: "경상북도 밖(대구 군위군 포함)의 주소는 제출할 소방서를 직접 적어 주십시오." };
}
/** 제출처(소방서장): 직접 입력이 있으면 그것, 없으면 주소로 자동 */
export function stationFor(addr, manual) {
  if (manual && manual.trim()) return manual.trim();
  return stationInfo(addr).station;
}

/** 날짜 차이(포함 일수) */
export function daysInclusive(a, b) {
  if (!a || !b) return "";
  const d = (new Date(b) - new Date(a)) / 86400000;
  return Number.isFinite(d) && d >= 0 ? Math.round(d) + 1 : "";
}

/** 오늘 'YYYY-MM-DD'(한국시간) */
export function todayStr() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/** 빈 보고서 */
export function emptyReport(kind = "owner") {
  const t = todayStr();
  const vr = VARIANTS[kind] || VARIANTS.owner;
  const pro = vr.id !== "owner";
  return {
    v: 1,
    kind: vr.id,
    checker: vr.checker, // owner | mgmt(소방시설관리업자) | manager(소방안전관리자로 선임된 관리사·기술사)
    firm: { name: "", tel: "" },
    staff: {}, // 점검인력 배치 산정 — 보고서 값과 다르게 바꾼 항목만
    toWhom: pro ? "관계인" : "소방서", // 보고서 제출처: 관리업자 등 → 관계인(10일 이내), 관계인 → 소방서(15일 이내)
    name: "",
    useLabel: "",
    addr: "",
    station: "",
    from: t,
    to: t,
    reportDate: t,
    owner: { kind: "소유자", name: "", tel: "" },
    email: { agree: false, addr: "" },
    inspectors: [
      { role: "주된 점검인력", name: "", qual: pro ? "소방시설관리사" : "관계인", no: "", days: "" },
      { role: "보조 점검인력", name: "", qual: pro ? "초급점검자" : "관계인", no: "", days: "" },
      { role: "보조 점검인력", name: "", qual: pro ? "초급점검자" : "관계인", no: "", days: "" },
    ],
    grade: pro ? "" : "3급",
    manager: { type: "소방안전관리자수첩", name: "", tel: "", edu: "" },
    plan: "작성보관", // 작성보관 | 작성미보관 | 미작성
    prevOp: vr.first ? "미실시" : "실시",
    prevComp: vr.comp && !vr.first ? "실시" : "미실시",
    edu: "실시",
    drill: "실시",
    insurance: { on: false, company: "", from: "", to: "", person: "", property: "" },
    multi: {}, // { 휴게음식점영업: 개소수 }
    bld: { permit: "", approval: "", area: "", bArea: "", households: "", gf: "", bf: "", height: "", dong: "1", structure: "콘크리트구조", roof: "슬래브", ramp: "", stair: "1", stairSp: "", elev: "", elevE: "", elevR: "", parking: [] },
    rows: {}, // { rowId: { on, bad: { code: {text, qty} } } }
    mRows: {}, // 다중이용업소 안전시설등
    note: "",
    detail: {
      dong: "",
      ext: { powder: "", other: "", throw: "", simple: "", spread: "", auto: "" },
      afd: { floor: "1", room: "", alarm: "전층경보", visual: true, heat: true, smoke: true },
      alarm: { kind: "비상벨설비", floor: "1", room: "" },
      single: { power: "건전지" },
      sspk: { kind: "" },
      guide: { exit: true, path: true, seat: false },
      elight: { power: "내장형" },
      plight: { power: "건전지식" },
      escape: { kind: "완강기" },
      report: { floor: "1", room: "" },
    },
    plan10: { from: "", to: "", items: {} }, // 이행계획서: items { code: {from,to} }
  };
}

/** 결과 화면에서 넘어오는 값으로 보고서 채우기 */
export function applySeed(rep, seed) {
  if (!seed) return rep;
  const r = { ...rep, bld: { ...rep.bld }, rows: {}, mRows: { ...rep.mRows } };
  r.useLabel = seed.useLabel || r.useLabel;
  if (!rep.kind || rep.kind === "owner") r.grade = "3급";
  else if (seed.grade) r.grade = seed.grade;
  r.bld.area = seed.area ?? r.bld.area;
  r.bld.gf = seed.gf ?? r.bld.gf;
  r.bld.bf = seed.bf ?? r.bld.bf;
  r.bld.households = seed.households ?? "";
  r.bld.height = seed.height ?? r.bld.height;
  r.bld.permit = seed.permit || "";
  r.bld.approval = seed.approval || "";
  r.bld.parking = seed.parking || [];
  const inst = new Set(seed.facs || []);
  for (const row of ALL_ROWS) {
    if (row.group) continue;
    const on = (row.fac || []).some((k) => inst.has(k));
    r.rows[row.id] = { on, bad: {} };
  }
  if (inst.has("autoext")) r.rows[seed.residential ? "auto_res" : "auto_com"] = { on: true, bad: {} };
  r.rows.exit = { on: true, bad: {} };
  r.rows.door = { on: !!seed.door, bad: {} };
  r.rows.flame = { on: !!seed.flame, bad: {} };
  r.seedNote = seed.note || "";
  r.seededAt = seed.at;
  return r;
}

/** 묶음 행 결과 */
export function rowState(rep, row) {
  if (row.group) {
    const subs = row.group.map((id) => rep.rows[id]).filter((x) => x && x.on);
    if (!subs.length) return { on: false, res: "/" };
    return { on: true, res: subs.some((x) => Object.keys(x.bad || {}).length) ? "×" : "○" };
  }
  const st = rep.rows[row.id];
  if (!st || !st.on) return { on: false, res: "/" };
  return { on: true, res: Object.keys(st.bad || {}).length ? "×" : "○" };
}
export function mRowState(rep, row) {
  const st = rep.mRows[row.id];
  if (!st || !st.on) return { on: false, res: "/" };
  return { on: true, res: Object.keys(st.bad || {}).length ? "×" : "○" };
}

/** 불량 목록(제8쪽·이행계획서) */
export function defects(rep) {
  const out = [];
  const add = (row, st, cat) => {
    for (const [code, b] of Object.entries((st && st.bad) || {})) {
      out.push({ cat, row: row.label, code, text: b.text, qty: b.qty || "" });
    }
  };
  for (const row of ALL_ROWS) if (!row.group && rep.rows[row.id] && rep.rows[row.id].on) add(row, rep.rows[row.id], row.cat);
  for (const row of M_ROWS) if (rep.mRows[row.id] && rep.mRows[row.id].on) add(row, rep.mRows[row.id], "안전시설등");
  out.sort((a, b) => DEFECT_CATS.indexOf(a.cat) - DEFECT_CATS.indexOf(b.cat) || a.code.localeCompare(b.code, "en", { numeric: true }));
  return out;
}

/** 필수 입력 확인 */
export function missingFields(rep) {
  const m = [];
  if (!rep.name.trim()) m.push("명칭(상호)");
  if (!rep.useLabel.trim()) m.push("대상물 구분(용도)");
  if (!rep.addr.trim()) m.push("소재지");
  if ((rep.toWhom || "소방서") === "소방서" && !stationFor(rep.addr, rep.station)) m.push("제출할 소방서");
  if (!rep.from || !rep.to || rep.to < rep.from) m.push("점검기간");
  if (!rep.owner.name.trim()) m.push("관계인 성명");
  if ((rep.checker || "owner") === "owner" && !rep.owner.tel.trim()) m.push("관계인 전화번호");
  if (rep.checker === "mgmt" && !(rep.firm && rep.firm.name.trim())) m.push("관리업자 업체명");
  if (rep.checker === "mgmt" && !(rep.firm && rep.firm.tel.trim())) m.push("관리업자 전화번호");
  if (!rep.grade) m.push("소방안전관리등급");
  rep.inspectors.forEach((p, i) => {
    if (!p.name.trim()) m.push(`점검자 ${i + 1} 성명`);
    if (!p.qual.trim()) m.push(`점검자 ${i + 1} 자격구분`);
  });
  if (!rep.manager.name.trim()) m.push("소방안전관리자 성명");
  if (rep.checker === "manager" && !rep.manager.tel.trim()) m.push("소방안전관리자 전화번호");
  if (!ALL_ROWS.some((r) => !r.group && rep.rows[r.id] && rep.rows[r.id].on)) m.push("설치된 소방시설(1개 이상)");
  if (rep.email.agree && !rep.email.addr.trim()) m.push("전자우편 주소");
  return m;
}
