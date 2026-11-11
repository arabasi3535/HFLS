// ============================================================
// 자체점검 보고서 ↔ 엑셀 서식(빈 서식 작성 → 올리기)
// ============================================================
import { VARIANTS, ROWS_L, ROWS_R, ROWS_M_L, ROWS_M_R, MULTI, QUALS_OWNER, QUALS_PRO, rowItems, defectText, emptyReport } from "../../law/report";
import { makeBook, readForms, yn, toDate } from "../sheetForm";

const SEG = {
  toWhom: ["관계인", "소방서"],
  checker: [["mgmt", "소방시설관리업자"], ["manager", "소방안전관리자(관리사·기술사)"]],
  "owner.kind": ["소유자", "관리자", "점유자"],
  "manager.type": ["소방안전관리자수첩", "소방기술자격", "업무대행감독", "겸직", "기타"],
  grade: ["3급", "2급", "1급", "특급"],
  plan: ["작성보관", "작성미보관", "미작성"],
  prevOp: ["실시", "미실시"],
  prevComp: ["실시", "미실시"],
  edu: ["실시", "미실시"],
  drill: ["실시", "미실시"],
  "bld.structure": ["콘크리트구조", "철골구조", "조적조", "목구조", "기타"],
  "bld.roof": ["슬래브", "기와", "슬레이트", "기타"],
  "detail.afd.alarm": ["전층경보", "우선경보"],
  "detail.sspk.kind": ["상수도", "캐비닛", "펌프"],
  "detail.alarm.kind": ["비상벨설비", "자동식사이렌설비"],
  "detail.single.power": ["건전지", "상용전원"],
  "detail.escape.kind": ["완강기", "간이완강기", "피난사다리", "구조대", "미끄럼대", "공기안전매트", "다수인피난장비", "승강식피난기"],
  "detail.elight.power": ["내장형", "축전지설비", "자가발전설비"],
  "detail.plight.power": ["건전지식", "충전식 배터리식"],
};
const PARKING = ["지하", "지상", "필로티", "기계식", "옥상", "옥외"];

const getP = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
function setP(o, path, v) {
  const ks = path.split(".");
  const root = { ...o };
  let cur = root;
  for (let i = 0; i < ks.length - 1; i++) {
    const k = ks[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
    cur = cur[k];
  }
  cur[ks[ks.length - 1]] = v;
  return root;
}

/** [키, 항목, 종류(text·num·date·yn·seg·parking), 설명, 조건] */
function fieldsFor(vr) {
  const pro = vr.id !== "owner";
  const QUALS = pro ? QUALS_PRO : QUALS_OWNER;
  const F = [
    { sec: "1. 대상물·점검기간", secHelp: "* 표시는 필수" },
    ["name", "명칭(상호) *", "text"],
    ["useLabel", "대상물 구분(용도) *", "text", "예: 근린생활시설"],
    ["addr", "소재지(도로명주소) *", "text", "예: 경상북도 안동시 ○○로 00"],
    ["station", "제출할 소방서", "text", "비우면 주소로 자동(경상북도) — 예: 안동소방서장"],
    ["from", "점검 시작일 *", "date"],
    ["to", "점검 종료일 *", "date"],
    ["reportDate", "보고서 작성일", "date", "비우면 오늘"],
    pro && ["toWhom", "보고서 제출처", "seg", "관리업자 등 → 관계인(10일 이내), 관계인 → 소방서(15일 이내)"],
    { sec: "2. 관계인·점검자" },
    pro && ["checker", "점검자", "seg"],
    pro && ["firm.name", "관리업자 업체명", "text", "점검자가 소방시설관리업자일 때"],
    pro && ["firm.tel", "관리업자 전화번호", "text"],
    ["owner.kind", "관계인 구분", "seg"],
    ["owner.name", "관계인 성명 *", "text"],
    ["owner.tel", `관계인 전화번호${pro ? "" : " *"}`, "text"],
  ];
  for (let i = 0; i < 6; i++) {
    const nm = i === 0 ? "주된 점검인력" : `보조 점검인력 ${i}`;
    const req = i < 3 ? " *" : "";
    F.push([`inspectors.${i}.name`, `${nm} 성명${req}`, "text", i >= 3 ? "필요할 때만(최대 6명)" : ""]);
    F.push([`inspectors.${i}.qual`, `${nm} 자격`, "qual", "", QUALS]);
    F.push([`inspectors.${i}.no`, `${nm} 자격번호`, "text", "있으면"]);
  }
  F.push(
    ["email.agree", "전자우편 송달 동의", "yn", "조치명령서 등을 전자우편으로 받음"],
    ["email.addr", "전자우편 주소", "text"],
    { sec: "3. 소방안전관리" },
    ["manager.name", "소방안전관리자 성명 *", "text"],
    ["manager.tel", "소방안전관리자 전화번호", "text"],
    ["manager.type", "선임 자격", "seg"],
    ["manager.edu", "최근 교육이수일", "date"],
    ["grade", "소방안전관리등급", "seg"],
    ["plan", "소방계획서", "seg"],
    ["prevOp", "전년도 작동점검", "seg"],
    ["prevComp", "전년도 종합점검", "seg"],
    ["edu", "소방안전교육", "seg"],
    ["drill", "소방훈련", "seg"],
    ["insurance.on", "화재보험 가입", "yn"],
    ["insurance.company", "보험사", "text"],
    ["insurance.from", "보험 가입 시작일", "date"],
    ["insurance.to", "보험 가입 종료일", "date"],
    ["insurance.person", "대인(천만원)", "num"],
    ["insurance.property", "대물(천만원)", "num"],
    { sec: "4. 건축물 정보" },
    ["bld.permit", "건축허가일", "date"],
    ["bld.approval", "사용승인일", "date"],
    ["bld.area", "연면적(㎡)", "num"],
    ["bld.bArea", "건축면적(㎡)", "num"],
    ["bld.gf", "지상 층수", "num"],
    ["bld.bf", "지하 층수", "num"],
    ["bld.height", "높이(m)", "num"],
    ["bld.dong", "건물동수", "num"],
    ["bld.households", "세대수(공동주택)", "num"],
    ["bld.stair", "직통계단(개소)", "num"],
    ["bld.stairSp", "특별피난계단(개소)", "num"],
    ["bld.elev", "승용 승강기(대)", "num"],
    ["bld.structure", "구조", "seg"],
    ["bld.roof", "지붕", "seg"],
    ["bld.parking", "주차장", "parking", `여러 개는 쉼표로 — ${PARKING.join(", ")}`]
  );
  return F.filter(Boolean);
}

const DETAIL = [
  { sec: "6. 세부 현황", secHelp: "설치된 시설만 — 수량·위치" },
  ["detail.dong", "동명", "text", "비우면 명칭"],
  ["detail.ext.powder", "분말소화기(개)", "num"],
  ["detail.ext.other", "기타 소화기(개)", "num"],
  ["detail.ext.throw", "투척용 소화용구(개)", "num"],
  ["detail.ext.simple", "기타 간이소화용구(개)", "num"],
  ["detail.ext.spread", "자동확산소화기(개)", "num"],
  ["detail.ext.auto", "자동소화장치(개)", "num"],
  ["detail.afd.floor", "자동화재탐지설비 수신기 층(지상)", "text"],
  ["detail.afd.room", "자동화재탐지설비 수신기 실명", "text", "예: 관리실"],
  ["detail.afd.alarm", "자동화재탐지설비 경보방식", "seg"],
  ["detail.afd.heat", "열감지기 있음", "yn"],
  ["detail.afd.smoke", "연기감지기 있음", "yn"],
  ["detail.afd.visual", "시각경보기 있음", "yn"],
  ["detail.sspk.kind", "간이스프링클러 종류", "seg"],
  ["detail.alarm.kind", "비상경보설비 종류", "seg"],
  ["detail.alarm.floor", "비상경보설비 조작장치 층", "text"],
  ["detail.alarm.room", "비상경보설비 조작장치 실명", "text"],
  ["detail.single.power", "단독경보형감지기 전원", "seg"],
  ["detail.report.floor", "자동화재속보설비 속보기 층", "text"],
  ["detail.report.room", "자동화재속보설비 속보기 실명", "text"],
  ["detail.escape.kind", "피난기구 종류", "seg"],
  ["detail.guide.exit", "피난구유도등 있음", "yn"],
  ["detail.guide.path", "통로유도등 있음", "yn"],
  ["detail.guide.seat", "객석유도등 있음", "yn"],
  ["detail.elight.power", "비상조명등 비상전원", "seg"],
  ["detail.plight.power", "휴대용비상조명등 전원", "seg"],
];

const itemLabel = (it, comp) => `${it.code}${comp ? ` ${it.k}` : ""}  ${it.head ? `[${it.head}] ` : ""}${it.text}`;

/** 엑셀 빈 서식(rep을 주면 그 값으로 채움) */
export function reportBook(kind, rep) {
  const vr = VARIANTS[kind] || VARIANTS.owner;
  const r0 = rep || { ...emptyReport(vr.id), from: "", to: "", reportDate: "" };
  const fields = [];
  const push = (x) => {
    if (!Array.isArray(x)) return fields.push(x);
    const [key, label, type, help, extra] = x;
    const v = getP(r0, key);
    if (type === "seg") {
      const opts = SEG[key];
      const pairs = opts.map((o) => (Array.isArray(o) ? o : [o, o]));
      fields.push({ key, label, type: "list", list: pairs.map((p) => p[1]), value: (pairs.find((p) => p[0] === v) || [])[1] || "", help });
    } else if (type === "qual") fields.push({ key, label, type: "list", list: extra, free: true, value: v || "", help });
    else if (type === "yn") fields.push({ key, label, type: "yn", value: v === true ? "예" : "", help });
    else if (type === "parking") fields.push({ key, label, type: "text", value: (v || []).join(", "), help });
    else fields.push({ key, label, type, value: v == null ? "" : v, help });
    return null;
  };
  fieldsFor(vr).forEach(push);
  // 5. 소방시설 점검 결과
  fields.push({ sec: "5. 소방시설 점검 결과", secHelp: "설치된 설비는 「설치」에 예 → 불량 항목만 입력값에 불량 내용(또는 「불량」), 비고에 수량·위치. 비우면 양호" });
  const rowsBlock = (rows, pre, store) => {
    for (const row of rows.filter((x) => !x.group)) {
      const st = (r0[store] || {})[row.id] || {};
      fields.push({ sec: `${row.cat} — ${row.label}` });
      fields.push({ key: `${pre}.${row.id}`, label: "설치(점검 대상)", type: "yn", value: st.on ? "예" : "", help: "설치돼 있으면 예" });
      for (const it of rowItems(row, vr.comp)) {
        const b = (st.bad || {})[it.code];
        fields.push({ key: `${pre}bad.${row.id}.${it.code}`, label: itemLabel(it, vr.comp), type: "text", value: b ? b.text : "", note: { value: b ? b.qty : "" } });
      }
    }
  };
  rowsBlock([...ROWS_L, ...ROWS_R], "row", "rows");
  fields.push({ key: "note", label: "비고(점검표에 없는 사항)", type: "text", value: r0.note || "" });
  DETAIL.forEach(push);
  fields.push({ sec: "7. 다중이용업소", secHelp: "입점 업소 개소 수 — 없으면 비워 둠" });
  for (const m of MULTI) fields.push({ key: `multi.${m}`, label: m, type: "num", value: (r0.multi || {})[m] || "" });
  fields.push({ sec: "다중이용업소 안전시설등 점검 결과", secHelp: "다중이용업소가 있을 때만" });
  rowsBlock([...ROWS_M_L, ...ROWS_M_R], "mrow", "mRows");
  fields.push({ sec: "8. 이행계획서(불량이 있을 때)" });
  fields.push({ key: "plan10.from", label: "이행조치 필요기간 시작", type: "date", value: (r0.plan10 || {}).from || "" });
  fields.push({ key: "plan10.to", label: "이행조치 필요기간 종료", type: "date", value: (r0.plan10 || {}).to || "" });

  return makeBook([
    {
      id: `hfls:report:${vr.id}`,
      name: "보고서",
      title: `${vr.title} — 입력 서식(별지 제9호서식)`,
      intro: [
        "노란 칸(입력값·비고)에만 적으십시오. 목록이 있는 칸은 눌러서 고릅니다. 다 쓴 뒤 앱 「자체점검 → " + vr.tab + "」의 「불러오기」로 이 파일을 올리면 보고서가 채워집니다.",
        "점검 결과: 설치된 설비의 「설치」를 예로 하고, 불량인 점검항목에만 불량 내용(「불량」이라고만 적어도 됨)과 비고(수량·위치)를 적습니다. 비워 둔 항목은 양호입니다.",
      ],
      noteCol: "비고(수량·위치)",
      fields,
    },
  ]);
}

/** 올린 엑셀 → 보고서. { rep, warn } */
export function readReportBook(buf, kind) {
  const vr = VARIANTS[kind] || VARIANTS.owner;
  const forms = readForms(buf);
  const f = forms.find((x) => x.id.startsWith("hfls:report:"));
  if (!f) throw new Error("자체점검 보고서 엑셀 서식이 아닙니다. 「빈 서식 받기(엑셀)」로 받은 파일을 써 주십시오.");
  const warn = [];
  const fk = f.id.split(":")[2];
  if (fk !== vr.id) {
    const fv = VARIANTS[fk];
    warn.push(`「${fv ? fv.tab : fk}」 서식입니다 — 같은 항목만 옮겼습니다.`);
  }
  const v = f.values;
  let rep = emptyReport(vr.id);
  const has = (k) => k in v && v[k] !== "";
  for (const x of [...fieldsFor(vr), ...DETAIL]) {
    if (!Array.isArray(x)) continue;
    const [key, label, type] = x;
    if (!has(key)) continue;
    const s = v[key];
    let val = s;
    if (type === "seg") {
      const pairs = SEG[key].map((o) => (Array.isArray(o) ? o : [o, o]));
      const p = pairs.find((q) => q[1] === s || q[0] === s);
      if (!p) {
        warn.push(`「${label.replace(" *", "")}」: 「${s}」는 목록에 없는 값입니다.`);
        continue;
      }
      val = p[0];
    } else if (type === "yn") {
      const b = yn(s);
      if (b === null) {
        warn.push(`「${label}」: 「${s}」 → 예/아니오로 적어 주십시오.`);
        continue;
      }
      val = b;
    } else if (type === "date") {
      val = toDate(s);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) warn.push(`「${label.replace(" *", "")}」: 「${s}」 → 2026-03-05 형식으로 적어 주십시오.`);
    } else if (type === "num") val = s.replace(/[,\s]/g, "");
    else if (type === "parking") val = s.split(/[,，·\s]+/).map((p) => p.trim()).filter((p) => PARKING.includes(p));
    if (key.startsWith("inspectors.")) {
      const i = Number(key.split(".")[1]);
      while (rep.inspectors.length <= i) rep = { ...rep, inspectors: [...rep.inspectors, { role: "보조 점검인력", name: "", qual: vr.id === "owner" ? "관계인" : "초급점검자", no: "", days: "" }] };
    }
    rep = setP(rep, key, val);
  }
  // 빈 보조 점검인력(4~6번째) 정리
  rep.inspectors = rep.inspectors.filter((p, i) => i < 3 || p.name);
  if (vr.id === "owner") rep.checker = "owner";
  // 점검 결과
  const readRows = (rows, pre, store) => {
    const out = {};
    for (const row of rows.filter((x) => !x.group)) {
      const items = rowItems(row, vr.comp);
      const bad = {};
      for (const it of items) {
        const k = `${pre}bad.${row.id}.${it.code}`;
        const t = (v[k] || "").trim();
        const q = (f.notes[k] || "").trim();
        if (!t && !q) continue;
        if (yn(t) === false || t === "양호") continue;
        const text = !t || yn(t) === true || t === "불량" ? defectText(it.text) : t;
        bad[it.code] = { text, qty: q };
      }
      const on = yn(v[`${pre}.${row.id}`]);
      if (on === null && v[`${pre}.${row.id}`]) warn.push(`「${row.label}」 설치: 「${v[`${pre}.${row.id}`]}」 → 예/아니오`);
      if (on || Object.keys(bad).length) {
        out[row.id] = { on: true, bad };
        if (!on) warn.push(`「${row.label}」: 불량 항목이 있어 설치로 봤습니다.`);
      }
    }
    return out;
  };
  rep.rows = readRows([...ROWS_L, ...ROWS_R], "row", "rows");
  rep.mRows = readRows([...ROWS_M_L, ...ROWS_M_R], "mrow", "mRows");
  if (has("note")) rep.note = v.note;
  rep.multi = {};
  for (const m of MULTI) if (has(`multi.${m}`)) rep.multi[m] = v[`multi.${m}`].replace(/[,\s]/g, "");
  rep.plan10 = { from: has("plan10.from") ? toDate(v["plan10.from"]) : "", to: has("plan10.to") ? toDate(v["plan10.to"]) : "", items: {} };
  return { rep, warn };
}
